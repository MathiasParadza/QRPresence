# attendance/ai_chat/llm_agent.py

from attendance.models import Attendance, Session, Student, Course
from datetime import datetime, timedelta
from django.db.models import Count, Q


def answer_natural_language_query(query: str) -> str:
    """
    Basic AI agent logic placeholder for interpreting attendance queries.
    This version will match simple patterns until LLM is integrated.
    """
    query = query.lower()

    if "absent last week" in query:
        today = datetime.today()
        last_week = today - timedelta(days=7)
        absent_students = Student.objects.exclude(
            attendance__session__date__gte=last_week
        ).distinct()
        names = ", ".join(s.name for s in absent_students)
        return f"Absent students last week: {names if names else 'None'}"

    elif "lowest attendance" in query:
        course_code = query.split()[-1]  # naive extraction
        try:
            course = Course.objects.get(code__iexact=course_code)
            students = Student.objects.filter(enrollments__course=course)
            attendance_data = []
            for student in students:
                total_sessions = Session.objects.filter(course=course).count()
                attended = Attendance.objects.filter(student=student, session__course=course).count()
                percentage = (attended / total_sessions * 100) if total_sessions else 0
                attendance_data.append((student.name, percentage))
            attendance_data.sort(key=lambda x: x[1])
            return f"Student with lowest attendance: {attendance_data[0][0]} ({attendance_data[0][1]:.1f}%)"
        except Course.DoesNotExist:
            return "Course not found."

    elif "trend" in query:
        trend = Attendance.objects.values('session__date').annotate(count=Count('id')).order_by('session__date')
        response = "Weekly Attendance Trends:\n"
        for entry in trend:
            response += f"{entry['session__date']}: {entry['count']} records\n"
        return response

    else:
        return "Sorry, I couldn't understand the query. Please try a different question."
