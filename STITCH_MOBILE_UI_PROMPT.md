# Farishtaa Mobile App UI Design Prompt for Stitch by Google

## Project Overview

**Farishtaa** (meaning "Angel" in Urdu/Hindi) is an AI-powered healthcare platform designed to:
- Help patients check symptoms using an intelligent AI chatbot powered by Google Gemini
- Discover nearby doctors and hospitals based on geo-location
- View detailed doctor/hospital profiles with ratings and reviews
- Enable doctors and hospitals to manage their professional presence
- Provide multi-language support (English, Hindi, Odia) for accessibility

The mobile app should provide a seamless, intuitive experience for patients to access healthcare guidance and doctor discovery.

---

## Design System & Visual Guidelines

### Color Palette (Healthcare + Modern)
- **Primary Color**: Medical Blue (`#0B63E5` or `#1D4ED8`)
- **Secondary Color**: Healing Green (`#10B981` or `#059669`)
- **Accent Color**: Warm Orange (`#F97316` for urgency/important actions)
- **Success Color**: Green (`#22C55E`)
- **Warning Color**: Amber (`#F59E0B`)
- **Error Color**: Red (`#EF4444`)
- **Neutral Base**: White (`#FFFFFF`) with gray scale for backgrounds
- **Dark Mode**: Dark Blue (`#0F172A`) background, with light text
- **Care-Focused Gradient**: Subtle gradient from blue to teal for hero sections

### Typography
- **Primary Font**: System font stack (San Francisco, Segoe UI, Roboto) for optimal performance
- **Heading Hierarchy**: 
  - H1: 32px, Bold (700), for main page titles
  - H2: 24px, Semi-Bold (600), for section headers
  - H3: 20px, Semi-Bold (600), for card titles
  - Body: 16px, Regular (400), for descriptions
  - Small Text: 14px, Regular (400), for labels and meta info
- **Line Height**: 1.5 for readability, 1.6 for body text
- **Letter Spacing**: Slight increase for better legibility in medical context

### Spacing & Layout
- **Base Unit**: 8px grid system
- **Padding**: 16px (2 units) for cards, 24px (3 units) for sections
- **Margin**: 12px (1.5 units) between elements, 24px between major sections
- **Border Radius**: 12px for cards and inputs, 8px for small elements
- **Shadow System**:
  - Subtle: `0 1px 3px rgba(0,0,0,0.12)`
  - Medium: `0 4px 6px rgba(0,0,0,0.1)`
  - Elevated: `0 10px 25px rgba(0,0,0,0.15)`

### Icons & Imagery
- Use **Lucide React Icons** for consistency with existing frontend
- **Icon Size**: 24px for primary actions, 20px for secondary, 16px for small
- **Doctor/Hospital Avatars**: Rounded squares (16px border radius) with initials or professional photos
- **Illustration Style**: Minimalist flat design with subtle gradients for onboarding screens
- **Medical Imagery**: Professional, diverse representation of healthcare professionals

---

## Navigation Structure

### Bottom Tab Navigation (Primary)
1. **Home** - Quick access to symptom checker and featured content
2. **Search** - Find doctors/hospitals by specialty and location
3. **Chat** - Access chat sessions with AI assistant
4. **Account** - Profile management and settings

### Drawer Navigation (Additional)
- My Appointments (if applicable)
- Saved Doctors (favorites)
- Medical History
- Language Settings
- Theme Toggle (Dark/Light)
- Help & Support
- Logout

---

## Key Screens & Features

### Screen 1: Splash/Onboarding
- **Hero Image**: Farishtaa logo with gradient background (blue to teal)
- **Key Message**: "Your Health Angel at Your Fingertips"
- **Call-to-Action Buttons**: 
  - "Sign Up as Patient"
  - "Sign Up as Doctor/Hospital"
  - "Continue as Guest"
- **Accessibility**: Text size adjustment, clear contrast, readable fonts
- **Animation**: Smooth fade-in effect for hero content

### Screen 2: Home Dashboard
**Layout Structure:**
- **Header Section** (Status Bar + Top Bar):
  - User greeting: "Hello, [Username]!"
  - Language selector dropdown (EN, HI, OR)
  - Theme toggle (Sun/Moon icon)
  - Notification bell icon

- **Quick Action Banner** (Card with gradient background):
  - Large CTA: "Feel Unwell? Ask Farishtaa AI"
  - Icon: Animated health/heart icon
  - Tap action: Navigate to AI symptom checker
  - Subtle animation on scroll

- **Recent Chats Section**:
  - Horizontal scrollable list of recent AI conversations
  - Each chat shows: timestamp, first few words of conversation
  - "View All" link to full chat history
  - Pull-to-refresh functionality

- **Recommended Doctors** (Personalized):
  - "Based on Your Search" or "Top Rated Near You"
  - Card layout: Doctor image, name, specialty, distance, average rating (★4.5/5)
  - Quick action buttons: "View Profile" and "Message"

- **Explore Specialties**:
  - Grid of 6-8 medical specialties
  - Each icon with specialty name below
  - Tap to filter doctors by specialty
  - Examples: Cardiologist, Dermatologist, ENT, Gynecologist, etc.

- **Bottom Section**:
  - "Need Immediate Care?" with urgent care options
  - "Book Your Consultation" CTA button

### Screen 3: AI Symptom Checker (Chat Interface)
**Layout:**
- **Header**: Back button, "Symptom Checker" title, info icon
- **Chat Conversation Area**:
  - Messages from AI aligned to left with blue background
  - Messages from user aligned to right with gray background
  - Smooth message animation on appear
  - Avatar icons for both user and AI (Farishtaa logo for AI)
  - Timestamp on longer gaps between messages
  - Read/unread status indicators

- **User Input Section**:
  - Text input field with placeholder: "Describe your symptoms..."
  - Microphone icon button for voice input (speech-to-text)
  - Send button (arrow icon) on the right
  - Input field grows as user types (max 4 lines)
  - Character counter if needed

- **Quick Response Buttons**:
  - Below input: Show suggested responses when relevant
  - Example: "I have fever", "Pain in chest", "Difficulty breathing"
  - Styled as light blue outlined buttons
  - Tap to auto-fill input

- **Loading State**:
  - Animated typing indicator (three dots bouncing)
  - "Analyzing your symptoms..." message

- **Recommendation Card** (When diagnosis ready):
  - "Based on your symptoms, we recommend:"
  - List of suggested specialists with icons
  - "Find Doctors in Your Area" CTA button
  - Severity indicator: Low/Medium/High with color coding

### Screen 4: Doctor Search & Discovery
**Layout Structure:**
- **Search Header**:
  - Search input field with location icon
  - Filter button (Specialty, Distance, Rating)
  - Sort dropdown (Distance, Rating, Experience)

- **Filters Panel** (On tap of filter button):
  - Specialty multi-select (Checkboxes)
  - Distance slider (5km to 50km)
  - Minimum rating slider (1-5 stars)
  - Price range slider (if available)
  - "Apply Filters" and "Reset" buttons

- **Doctor List**:
  - Card-based layout with each doctor showing:
    - Profile image (circular, 80px)
    - Name and primary specialty
    - Experience: "8 years experience"
    - Distance: "2.5 km from you" with distance icon
    - Rating: 4.5/5 stars with review count (e.g., "156 reviews")
    - Services: Brief list (Online Consultation, In-Clinic, etc.)
  - Action buttons: "View Profile" and "Message"
  - Swipe right to add to favorites
  - Empty state: "No doctors found. Try adjusting filters"

- **Location-Based Indicator**:
  - Show "Nearby" badge for doctors within 5km
  - Show distance prominently for others

### Screen 5: Doctor Profile (Detailed View)
**Layout:**
- **Profile Header**:
  - Large doctor image (with fallback avatar)
  - Back button and share button
  - Like/bookmark button (heart icon)
  - Doctor name, primary specialty
  - Experience years
  - Overall rating (large display): 4.5/5 with total reviews

- **Quick Stats Section** (Horizontal scroll):
  - Patients Helped: 500+
  - Response Time: <1 hour
  - Consultation Fee: [Amount]
  - Availability: Open Today

- **About Section**:
  - Detailed biography with "Read More/Less" toggle
  - Languages Spoken: [List with flags]
  - Qualifications: MBBS, MD (with institution)
  - Hospital/Clinic Affiliation

- **Services Offered**:
  - Tabs or pills: "Online", "In-Clinic", "Phone"
  - Availability calendar/time slots for each service
  - Booking CTA for each service

- **Reviews Section**:
  - Summary: Average rating, total count
  - Filter by rating (5 stars, 4+, 3+)
  - Each review shows: Patient name, rating, date, review text
  - Review images if available
  - "See All Reviews" button

- **Location Map**:
  - Small embedded map showing clinic/hospital location
  - Address text with copy button
  - Distance and estimated time

- **Action Buttons** (Sticky at bottom):
  - Primary: "Book Consultation" (blue)
  - Secondary: "Message Doctor" (outlined)
  - Tertiary: "Save Profile" (heart icon)

### Screen 6: Chat/Messaging
**Layout:**
- **Chat List** (if multiple conversations):
  - Recent conversations sorted by date
  - Each item: Doctor/AI avatar, name, last message preview, timestamp
  - Unread badge indicator (red circle)
  - Swipe to delete option

- **Individual Chat Screen**:
  - Header: Doctor photo, name, online status indicator
  - Message thread similar to symptom checker
  - Doctor messages aligned left, user messages aligned right
  - Timestamp grouping (Today, Yesterday, etc.)
  - Typing indicator when doctor is responding
  - Read receipt indicators

- **Input Area**:
  - Text input with attachment button (for medical records)
  - Send button
  - Emoji picker icon

### Screen 7: User Account/Profile
**Layout:**
- **Profile Header Card**:
  - User avatar (editable on tap)
  - Name and email
  - User type badge (Patient/Doctor/Hospital)
  - Edit Profile button

- **Profile Information Section**:
  - Name, Email, Phone, Address
  - Date of Birth (for patients)
  - Medical History summary (for patients)
  - Edit button for each section

- **Preferences Section**:
  - Language preferred (EN, HI, OR)
  - Theme preference (Light/Dark/Auto)
  - Notification settings toggle
  - Privacy settings

- **Saved Items**:
  - Favorite doctors list
  - Saved articles/resources
  - Medical records (if applicable)

- **Account Management**:
  - Change Password
  - Linked Accounts
  - Privacy Policy
  - Terms & Conditions
  - Help & Support
  - Logout button (red/warning color)

- **Additional Features**:
  - Delete Account (with confirmation)
  - Feedback/Rate App
  - App Version info

---

## Interaction Patterns & Animations

### Loading States
- **Skeleton Screens**: Use placeholder shimmer effect for doctor lists, chat loading
- **Progress Indicators**: Circular progress for file uploads, form submissions
- **Refresh Animation**: Pull-to-refresh gesture with rotating spinner

### Transitions
- **Page Navigation**: Slide in from right (forward), slide out to right (back)
- **Modal Dialogs**: Fade in with slight scale-up (bounce effect)
- **Sheet Bottom Navigation**: Slide up from bottom with easing
- **Tab Switching**: Slight cross-fade between tabs

### Micro-interactions
- **Button Hover/Press**: Subtle scale effect (98% on press)
- **Like/Bookmark**: Heart animation on click (fills with color)
- **Message Sent**: Checkmark animation
- **Form Validation**: Shake animation on error with red highlight
- **Success Feedback**: Toast notification with checkmark icon (auto-dismisses in 3 seconds)

### Gesture Support
- **Swipe Back**: Navigate to previous screen
- **Swipe Right on Doctor**: Add to favorites
- **Swipe Left on Chat**: Delete message/conversation (with confirmation)
- **Pull Down**: Refresh current page
- **Long Press**: Show context menu for actions

---

## Responsive Breakpoints & Mobile Considerations

### Device Support
- **Small Phones**: 320px - 375px (compact layout, single column)
- **Standard Phones**: 375px - 425px (primary target)
- **Larger Phones**: 425px - 480px (optimized spacing)
- **Tablets**: 768px+ (if applicable)

### Mobile-First Optimizations
- **Safe Area Handling**: Respect notches and rounded corners
- **Touch Target Size**: Minimum 48x48px for all interactive elements
- **Readable Text**: Minimum 16px font size for inputs and body text
- **Portrait Orientation**: Optimize for portrait (90% of usage)
- **Landscape Support**: Stack UI appropriately for landscape
- **Performance**: Lazy load images, optimize animations for 60fps

---

## Accessibility & Inclusivity

### Accessibility Features
- **WCAG 2.1 AA Compliance**: Ensure all content is accessible
- **Color Contrast**: Minimum 4.5:1 for text on background
- **Alternative Text**: Descriptions for all icons and images
- **Keyboard Navigation**: Support full keyboard navigation
- **Screen Reader Support**: Proper labeling for all UI elements
- **Focus Indicators**: Visible focus ring on interactive elements

### Multi-Language Support
- **Dynamic Text Sizing**: Support text size adjustment in UI settings
- **RTL Consideration**: Prepare for right-to-left languages (future)
- **Date Formats**: Locale-aware date/time display
- **Number Formatting**: Locale-specific number/currency display
- **Icon Direction**: Ensure icons work in all language contexts

### Diverse Representation
- **Healthcare Worker Images**: Show diverse professionals (gender, ethnicity, age)
- **Patient Representation**: Inclusive imagery in onboarding and illustrations
- **Inclusive Terminology**: Use gender-neutral language where applicable

---

## Dark Mode Implementation

- **Dark Background**: `#0F172A` or `#1A1F36`
- **Card Background**: `#1E293B` with subtle elevation
- **Text Colors**:
  - Primary Text: `#F1F5F9`
  - Secondary Text: `#94A3B8`
  - Muted Text: `#64748B`
- **Borders**: `#334155` for subtle separation
- **Gradient Adaptation**: Maintain readability with adjusted opacity
- **Toggle Location**: Header with current theme indicator

---

## Performance Considerations

- **Image Optimization**:
  - Use WebP format where supported, fallback to JPEG
  - Responsive images with srcset for different device sizes
  - Lazy load images below the fold
  - Compress to <100KB for avatars, <300KB for profile images

- **Code Splitting**: Load feature screens on-demand

- **Caching Strategy**: Cache doctor profiles, reviews locally for faster repeat views

- **Battery Optimization**: Minimize animations on low-battery mode

- **Network Optimization**: Progressive image loading (blur-up effect), offline support for cached content

---

## Error Handling & Empty States

### Error State Screens
- **Network Error**: 
  - Illustration: Broken connection icon
  - Message: "Unable to connect. Please check your internet."
  - CTA: "Retry" button with refresh icon
  - Option: Cached data if available

- **Server Error (500)**:
  - Illustration: Server-down icon
  - Message: "Something went wrong. Please try again later."
  - Support link with email/chat

- **Not Found (404)**:
  - Illustration: Lost/missing icon
  - Message: "Doctor not found. They may have removed their profile."
  - CTA: "Go Back" or "Find Another Doctor"

### Empty State Screens
- **No Chats**:
  - Illustration: Chat bubble icon
  - Message: "No conversations yet. Start by checking your symptoms!"
  - CTA: "Ask Farishtaa AI"

- **No Favorite Doctors**:
  - Illustration: Heart icon
  - Message: "No saved doctors yet. Explore and save your favorites!"
  - CTA: "Find Doctors"

- **No Search Results**:
  - Illustration: Magnifying glass icon
  - Message: "No doctors match your criteria."
  - Suggestions: "Try adjusting filters or searching nearby."

---

## Form Design & Validation

### Input Fields
- **Active State**: Blue border (2px) with subtle shadow
- **Focus State**: Animated blue glow effect
- **Error State**: Red border with error icon and message below
- **Success State**: Green border with checkmark
- **Disabled State**: Gray background, reduced opacity

### Form Patterns
- **Real-time Validation**: Validate as user types (with debounce)
- **Clear Error Messages**: Specific, helpful error text (not generic)
- **Auto-formatting**: Phone numbers, dates automatically formatted
- **Smart Defaults**: Pre-fill known information where applicable
- **Progress Indicator**: For multi-step forms (3/5 Steps)

### Button Patterns
- **Primary CTA**: Full-width blue button (56px height for thumb reach)
- **Secondary Action**: Outlined button, same size
- **Disabled State**: Grayed out with cursor not-allowed
- **Loading State**: Spinner replaces text, disabled state active
- **Success State**: Green background with checkmark icon

---

## Onboarding Flow

### Initial Signup/Login
1. **Welcome Screen**: Brand message, user type selection
2. **Credentials Screen**: Email/phone, password, terms agreement
3. **Profile Setup**: 
   - For patients: Name, DOB, emergency contact
   - For doctors: Name, specialty, qualifications
   - For hospitals: Hospital name, address, specialty categories
4. **Location Permission**: Request GPS permission with clear explanation
5. **Notification Permission**: Optional opt-in for notifications
6. **Completion**: Congratulations screen, CTA to main app

### Permission Requests
- **Location**: "Help us find doctors near you"
- **Notifications**: "Get updates about your appointments and messages"
- **Camera**: "Upload your profile photo"
- **Microphone**: "Use voice input for symptoms"

---

## Additional Micro-Features

### Search Suggestions
- **Auto-complete**: Suggest specialties as user types
- **Recent Searches**: Show recently searched specialties
- **Trending**: "Top searched this week"

### Doctor Comparison
- **Compare Multiple**: Select 2-3 doctors to compare side-by-side
- **Comparison Matrix**: Experience, rating, fees, availability
- **Quick Select**: Choose preferred doctor after comparison

### Appointment/Consultation Booking (Future)
- **Calendar View**: Interactive booking calendar
- **Time Slots**: Available hours highlighted
- **Confirmation**: Review booking details, set reminders

### Notifications
- **Appointment Reminders**: 1 hour before (with snooze option)
- **Message Alerts**: Badge on chat tab
- **New Reviews**: When doctor receives new patient review
- **System Messages**: App updates, maintenance alerts

---

## Browser/Device Compatibility

### Target Browsers
- **iOS Safari**: iOS 13+
- **Chrome Mobile**: Latest 2 versions
- **Samsung Internet**: Latest version
- **Firefox Mobile**: Latest version

### Performance Budget
- **Initial Load**: < 3 seconds on 4G
- **Interaction Response**: < 100ms
- **Animation Frame Rate**: Maintain 60fps

---

## Design File References

### Assets to Include
1. **Farishtaa Logo** (Multiple formats: PNG, SVG)
2. **Medical Icons Set**: 50+ icons for specialties, services
3. **Illustrations**: 
   - Onboarding screens (5 variations)
   - Empty states (4 variations)
   - Error states (3 variations)
4. **Doctor Avatar Placeholders**: 10 diverse options
5. **Background Patterns**: Subtle geometric patterns for empty states

---

## Summary: Design Priorities

1. **User-First**: Intuitive navigation, clear CTAs, minimal friction
2. **Healthcare Focus**: Professional appearance, trust-building design
3. **Accessibility**: WCAG compliance, inclusive design patterns
4. **Performance**: Fast load times, smooth interactions
5. **Inclusivity**: Multi-language, diverse representation
6. **Mobile Optimized**: Touch-friendly, thumb-operable interface
7. **Scalability**: Component-based design system for future growth

---

## Final Notes for Design Generation

This comprehensive prompt is designed to generate a healthcare-focused mobile UI that is:
- **Professional yet approachable** for medical contexts
- **Accessible to diverse users** across different abilities and languages
- **Performance-conscious** for various network conditions
- **Mobile-optimized** with proper touch targets and gestures
- **Consistent** with modern design patterns while maintaining healthcare brand trust

Use this prompt with Stitch by Google to generate high-fidelity designs that can be directly handed off to development teams for implementation in React Native or Flutter, ensuring a cohesive mobile experience for the Farishtaa platform.
