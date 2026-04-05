import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/auth_models.dart';
import '../../models/doctor_dashboard_models.dart';
import '../../services/doctor_dashboard_service.dart';

class DoctorReviewsScreen extends StatefulWidget {
  const DoctorReviewsScreen({
    super.key,
    required this.session,
    required this.dashboardService,
  });

  final UserSession session;
  final DoctorDashboardService dashboardService;

  @override
  State<DoctorReviewsScreen> createState() => _DoctorReviewsScreenState();
}

class _DoctorReviewsScreenState extends State<DoctorReviewsScreen> {
  List<DoctorDashboardReview> _reviews = <DoctorDashboardReview>[];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchReviews();
  }

  Future<void> _fetchReviews() async {
    setState(() => _loading = true);
    try {
      final reviews = await widget.dashboardService.getReviews(
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _reviews = reviews);
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final avgRating = _reviews.isEmpty
        ? 0.0
        : _reviews.map((item) => item.rating).reduce((a, b) => a + b) /
              _reviews.length;

    return RefreshIndicator(
      onRefresh: _fetchReviews,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Patient Reviews',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      avgRating == 0
                          ? 'No ratings'
                          : avgRating.toStringAsFixed(1),
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final filled = index < avgRating.round();
                        return Icon(
                          filled
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: Colors.amber,
                        );
                      }),
                    ),
                    const SizedBox(height: 6),
                    Text('${_reviews.length} review(s)'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            if (_reviews.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No reviews yet.'),
                ),
              )
            else
              ..._reviews.map(
                (review) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                review.patientName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              review.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                color: Colors.amber,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 2),
                            const Icon(
                              Icons.star_rounded,
                              color: Colors.amber,
                              size: 16,
                            ),
                          ],
                        ),
                        if (review.review.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(review.review),
                        ],
                        if (review.createdAt != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            DateFormat('dd MMM yyyy').format(review.createdAt!),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}
