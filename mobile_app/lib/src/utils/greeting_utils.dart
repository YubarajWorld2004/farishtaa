String getTimeBasedGreeting([DateTime? dateTime]) {
  final hour = (dateTime ?? DateTime.now()).hour;
  if (hour < 5) {
    return 'Good Night';
  }
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Noon';
  }
  if (hour < 21) {
    return 'Good Evening';
  }
  return 'Good Night';
}
