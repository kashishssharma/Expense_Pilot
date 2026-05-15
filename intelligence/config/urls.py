"""URL configuration for the Intelligence Service."""
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'intelligence-service'})

urlpatterns = [
    path('health/', health_check),
    path('api/analytics/', include('analytics.urls')),
]
