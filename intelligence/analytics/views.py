"""
Analytics API Views.

Each view:
  1. Reads user_id from query params (passed by the Node.js API)
  2. Fetches expense data directly from the shared PostgreSQL database
  3. Runs the intelligence engine
  4. Returns JSON results
"""
import pandas as pd
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from .engine import IntelligenceEngine

engine = IntelligenceEngine()


def fetch_expenses(user_id, months=6):
    """Fetch expenses from the shared PostgreSQL database."""
    query = """
        SELECT id, amount, category, date, notes
        FROM expenses
        WHERE user_id = %s AND date >= NOW() - INTERVAL '%s months'
        ORDER BY date DESC
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [user_id, months])
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
    return pd.DataFrame(rows, columns=columns) if rows else pd.DataFrame()


def fetch_budgets(user_id):
    """Fetch current month budgets with actual spending."""
    query = """
        SELECT b.category, b.monthly_limit,
               COALESCE(SUM(e.amount), 0) AS current_spent
        FROM budgets b
        LEFT JOIN expenses e
          ON e.user_id = b.user_id AND e.category = b.category
          AND EXTRACT(MONTH FROM e.date) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM NOW())
        WHERE b.user_id = %s
        GROUP BY b.category, b.monthly_limit
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [user_id])
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
    return pd.DataFrame(rows, columns=columns) if rows else pd.DataFrame()


class SpendingPatternsView(APIView):
    """
    GET /api/analytics/spending/?user_id=xxx&months=6
    Returns spending pattern analysis: categories, daily avg, weekly pattern.
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'success': False, 'message': 'user_id is required'}, status=400)

        months = int(request.query_params.get('months', 6))
        df = fetch_expenses(user_id, months)
        result = engine.analyze_spending(df)

        return Response({'success': True, 'data': result})


class AnomalyDetectionView(APIView):
    """
    GET /api/analytics/anomalies/?user_id=xxx&sensitivity=0.05
    Returns detected anomalous transactions using Isolation Forest.
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'success': False, 'message': 'user_id is required'}, status=400)

        sensitivity = float(request.query_params.get('sensitivity', 0.05))
        df = fetch_expenses(user_id, 6)
        result = engine.detect_anomalies(df, contamination=sensitivity)

        return Response({'success': True, 'data': result})


class PredictionsView(APIView):
    """
    GET /api/analytics/predictions/?user_id=xxx&months=3
    Returns spending predictions using Linear Regression.
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'success': False, 'message': 'user_id is required'}, status=400)

        months_ahead = int(request.query_params.get('months', 3))
        df = fetch_expenses(user_id, 12)
        result = engine.predict_spending(df, months_ahead=months_ahead)

        return Response({'success': True, 'data': result})


class RecommendationsView(APIView):
    """
    GET /api/analytics/recommendations/?user_id=xxx
    Returns personalized budget and savings recommendations.
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'success': False, 'message': 'user_id is required'}, status=400)

        expenses_df = fetch_expenses(user_id, 6)
        budgets_df = fetch_budgets(user_id)
        result = engine.generate_recommendations(expenses_df, budgets_df)

        return Response({'success': True, 'data': result})
