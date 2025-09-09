from django.http import JsonResponse
from attendance.models import Session

def geolocation_verification_middleware(get_response):
    def middleware(request):
        if request.path == '/api/attendance/mark/':
            student_lat = float(request.data.get('latitude', 0))
            student_long = float(request.data.get('longitude', 0))
            session = Session.objects.get(id=request.data.get('session_id'))

            distance = ((student_lat - session.gps_latitude) ** 2 + (student_long - session.gps_longitude) ** 2) ** 0.5
            if distance > session.allowed_radius:
                return JsonResponse({'error': 'Outside allowed location'}, status=403)

        return get_response(request)
    return middleware