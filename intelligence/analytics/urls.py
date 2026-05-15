"""URL patterns for the analytics API."""
from django.urls import path
from . import views

urlpatterns = [
    path('spending/', views.SpendingPatternsView.as_view(), name='spending-patterns'),
    path('anomalies/', views.AnomalyDetectionView.as_view(), name='anomaly-detection'),
    path('predictions/', views.PredictionsView.as_view(), name='predictions'),
    path('recommendations/', views.RecommendationsView.as_view(), name='recommendations'),
]
