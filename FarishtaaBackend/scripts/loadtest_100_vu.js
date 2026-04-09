const fs = require('fs');
const path = require('path');
const autocannon = require('autocannon');

const BASE_URL = process.env.LOADTEST_BASE_URL || 'http://127.0.0.1:3001';
const CONCURRENCY = Number.parseInt(process.env.LOADTEST_VUS || '100', 10);
const DURATION_SECONDS = Number.parseInt(process.env.LOADTEST_DURATION_SECONDS || '20', 10);

const resultsOutputPath = path.join(__dirname, 'loadtest_100_vu_results.json');

const toJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
};

const httpRequest = async ({ method = 'GET', apiPath, body, token }) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${apiPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await toJson(response);
  if (!response.ok) {
    const message = payload?.message || payload?.error || payload?.errorMessages?.[0] || response.statusText;
    throw new Error(`${method} ${apiPath} failed (${response.status}): ${message}`);
  }

  return payload;
};

const signupAndLogin = async ({ firstName, lastName, email, password, userType }) => {
  await httpRequest({
    method: 'POST',
    apiPath: '/api/auth/signup',
    body: {
      firstName,
      lastName,
      email,
      password,
      userType,
      age: userType === 'Patient' ? 31 : undefined,
      gender: 'Male',
    },
  });

  const login = await httpRequest({
    method: 'POST',
    apiPath: '/api/auth/login',
    body: { email, password },
  });

  return {
    token: login.token,
    userId: login.userId,
  };
};

const setupScenarioData = async () => {
  const runId = Date.now();
  const password = 'LoadTest@12345';

  const doctor = await signupAndLogin({
    firstName: 'Load',
    lastName: 'Doctor',
    email: `loadtestdoctor${runId}@gmail.com`,
    password,
    userType: 'Doctor',
  });

  const patient = await signupAndLogin({
    firstName: 'Load',
    lastName: 'Patient',
    email: `loadtestpatient${runId}@gmail.com`,
    password,
    userType: 'Patient',
  });

  await httpRequest({
    method: 'PUT',
    apiPath: '/api/doctor-dashboard/profile',
    token: doctor.token,
    body: {
      specialist: 'Cardiologist',
      experience: 8,
      degree: 'MBBS',
      languages: ['English', 'Hindi'],
      about: 'Load test profile',
      address: 'Bhubaneswar',
      fee: 0,
      clinicName: 'Load Test Clinic',
      availability: [{ day: 'All Days', startTime: '09:00 AM', endTime: '05:00 PM' }],
    },
  });

  const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const slots = await httpRequest({
    apiPath: `/api/patient/appointments/doctor/${encodeURIComponent(doctor.userId)}/slots?date=${encodeURIComponent(appointmentDate)}`,
    token: patient.token,
  });

  const availableSlots = Array.isArray(slots.availableSlots) ? slots.availableSlots : [];
  if (availableSlots.length === 0) {
    throw new Error('No available slots generated for load-test doctor');
  }

  const appointmentBooking = await httpRequest({
    method: 'POST',
    apiPath: '/api/patient/appointments/book',
    token: patient.token,
    body: {
      doctorId: doctor.userId,
      appointmentDate,
      slotTime: availableSlots[0],
      reason: 'Load test appointment',
      meetingType: 'online',
      appointmentFor: 'self',
    },
  });

  const appointmentId = appointmentBooking?.appointment?._id;
  if (!appointmentId) {
    throw new Error('Failed to create appointment for load test');
  }

  const accepted = await httpRequest({
    method: 'PATCH',
    apiPath: `/api/doctor-dashboard/appointments/${encodeURIComponent(appointmentId)}/status`,
    token: doctor.token,
    body: { status: 'accepted' },
  });

  let telemedicineSessionId = accepted?.appointment?.telemedicineSession;
  if (!telemedicineSessionId) {
    const sessionsData = await httpRequest({
      apiPath: '/api/patient/telemedicine/sessions?page=1&limit=50',
      token: patient.token,
    });
    telemedicineSessionId = sessionsData?.sessions?.[0]?._id;
  }

  if (!telemedicineSessionId) {
    throw new Error('Failed to create/find telemedicine session for load test');
  }

  const chatSession = await httpRequest({
    method: 'POST',
    apiPath: `/api/patient/sessions/${encodeURIComponent(patient.userId)}`,
    token: patient.token,
  });

  const chatSessionId = chatSession?.session?._id;
  if (!chatSessionId) {
    throw new Error('Failed to create symptom chat session for load test');
  }

  await httpRequest({
    method: 'POST',
    apiPath: `/api/patient/symptoms/${encodeURIComponent(patient.userId)}/${encodeURIComponent(chatSessionId)}`,
    token: patient.token,
    body: {
      userPrompt: 'I have mild headache and slight fever',
      language: 'English',
    },
  });

  return {
    patient,
    doctor,
    appointmentId,
    telemedicineSessionId,
    chatSessionId,
  };
};

const runLoad = (name, options) =>
  new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        ...options,
        connections: CONCURRENCY,
        duration: DURATION_SECONDS,
        pipelining: 1,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        const totalRequests = result?.requests?.total || 0;
        const non2xx = result?.non2xx || 0;
        const failures = (result?.errors || 0) + (result?.timeouts || 0) + non2xx;
        const errorRate = totalRequests > 0 ? (failures / totalRequests) * 100 : 0;

        resolve({
          name,
          requestsPerSec: result?.requests?.average || 0,
          totalRequests,
          p95Ms: result?.latency?.p95 || result?.latency?.p97_5 || result?.latency?.average || 0,
          p99Ms: result?.latency?.p99 || 0,
          errorRatePct: errorRate,
          non2xx,
          errors: result?.errors || 0,
          timeouts: result?.timeouts || 0,
        });
      }
    );

    instance.on('error', reject);
  });

const printSummary = (summaries) => {
  const rows = summaries.map((item) => ({
    endpoint: item.name,
    requests_per_sec: Number(item.requestsPerSec.toFixed(2)),
    total_requests: item.totalRequests,
    p95_ms: Number(item.p95Ms.toFixed(2)),
    p99_ms: Number(item.p99Ms.toFixed(2)),
    error_rate_pct: Number(item.errorRatePct.toFixed(2)),
    non2xx: item.non2xx,
    errors: item.errors,
    timeouts: item.timeouts,
  }));

  console.log('\nLoad Test Summary (100 concurrent users)');
  console.table(rows);
};

const run = async () => {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Concurrency (VU equivalent): ${CONCURRENCY}, duration: ${DURATION_SECONDS}s per endpoint`);

  const setup = await setupScenarioData();

  const scenarios = [
    {
      name: 'GET /api/patient/appointments?page=1&limit=50',
      options: {
        url: `${BASE_URL}/api/patient/appointments?page=1&limit=50`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${setup.patient.token}`,
        },
      },
    },
    {
      name: 'GET /api/patient/telemedicine/sessions/:id/messages?page=1&limit=100',
      options: {
        url: `${BASE_URL}/api/patient/telemedicine/sessions/${encodeURIComponent(setup.telemedicineSessionId)}/messages?page=1&limit=100`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${setup.patient.token}`,
        },
      },
    },
    {
      name: 'POST /api/patient/symptoms/:userId/:sessionId',
      options: {
        url: `${BASE_URL}/api/patient/symptoms/${encodeURIComponent(setup.patient.userId)}/${encodeURIComponent(setup.chatSessionId)}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${setup.patient.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: 'Headache for two days with mild nausea',
          language: 'English',
        }),
      },
    },
    {
      name: 'POST /api/doctor/nearby-search/Cardiologist',
      options: {
        url: `${BASE_URL}/api/doctor/nearby-search/Cardiologist`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: 20.2961,
          lng: 85.8245,
          radius: 10000,
        }),
      },
    },
  ];

  const summaries = [];
  for (const scenario of scenarios) {
    console.log(`\nRunning ${scenario.name}`);
    const summary = await runLoad(scenario.name, scenario.options);
    summaries.push(summary);
  }

  printSummary(summaries);

  fs.writeFileSync(
    resultsOutputPath,
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        concurrency: CONCURRENCY,
        durationSeconds: DURATION_SECONDS,
        generatedAt: new Date().toISOString(),
        summaries,
      },
      null,
      2
    )
  );

  console.log(`Detailed results saved to ${resultsOutputPath}`);
};

run().catch((error) => {
  console.error('Load test failed:', error);
  process.exitCode = 1;
});
