import qrcode
from io import BytesIO
from django.core.files import File
from django.conf import settings
from PIL import Image
import math


def generate_qr_code(data):
    """
    Generates a QR code image for the given data and returns it as a File object.
    """
    # Create the QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create an image from the QR code
    img = qr.make_image(fill='black', back_color='white')

    # Save image to a BytesIO object (so it can be saved in the database)
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)

    # Convert the image into a Django File object
    qr_code_file = File(img_io, name=f"{data}.png")
    
    return qr_code_file



#haversine function to calculate distance between two GPS coordinates
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# controlling attendance if only using campus wifi
def is_on_campus(request):
    ip = request.META.get('REMOTE_ADDR')
    allowed_ips = ['192.168.', '10.0.', '123.45.67.89']  # add your internal/public ranges
    return any(ip.startswith(prefix) for prefix in allowed_ips)
#needs to be included in mark attendance logic
   # def post(self, request):
    #    if not is_on_campus(request):
     #       return Response({"detail": "You must be on campus Wi-Fi to mark attendance."},
      #                      status=status.HTTP_403_FORBIDDEN

from functools import wraps
from django.http import JsonResponse

def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        if user.role != 'admin':
            return JsonResponse({'error': 'Admin access only'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view
