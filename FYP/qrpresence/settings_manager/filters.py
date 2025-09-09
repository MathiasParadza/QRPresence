from django_filters.rest_framework import FilterSet, ChoiceFilter, DateFromToRangeFilter
from .models import Attendance, Session
from django.utils import timezone
from datetime import timedelta

class AttendanceFilter(FilterSet):
    # Status filter options
    STATUS_CHOICES = [
        ('all', 'All'),
        ('Present', 'Present'),
        ('Absent', 'Absent'),
    ]
    
    # Date range filter options
    DATE_RANGE_CHOICES = [
        ('all', 'Any date'),
        ('today', 'Today'),
        ('week', 'Past 7 days'),
        ('month', 'This month'),
        ('year', 'This year'),
    ]
    
    status = ChoiceFilter(
        choices=STATUS_CHOICES,
        method='filter_status',
        label='Status'
    )
    
    date_range = ChoiceFilter(
        choices=DATE_RANGE_CHOICES,
        method='filter_date_range',
        label='Date Range'
    )
    
    session = ChoiceFilter(
        field_name='session__id',
        label='Session',
        choices=[],
        method='filter_session'
    )

    class Meta:
        model = Attendance
        fields = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically set session choices based on available sessions
        sessions = Session.objects.all()
        self.filters['session'].extra['choices'] = [
            (s.id, s.class_name) for s in sessions
        ]

    def filter_status(self, queryset, name, value):
        if value == 'all':
            return queryset
        return queryset.filter(status=value)

    def filter_date_range(self, queryset, name, value):
        today = timezone.now().date()
        if value == 'today':
            return queryset.filter(check_in_time__date=today)
        elif value == 'week':
            return queryset.filter(check_in_time__date__gte=today - timedelta(days=7))
        elif value == 'month':
            return queryset.filter(check_in_time__month=today.month)
        elif value == 'year':
            return queryset.filter(check_in_time__year=today.year)
        return queryset

    def filter_session(self, queryset, name, value):
        if value == 'all':
            return queryset
        return queryset.filter(session__id=value)