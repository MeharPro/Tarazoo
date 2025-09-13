# ============================================================================
# MATH QUIZ API - FLASK BACKEND
# ============================================================================
# This is a simple Flask API for a math quiz application.
# 
# SCALING RECOMMENDATIONS:
# 1. Move to a proper project structure with blueprints
# 2. Add database integration (PostgreSQL, MongoDB, etc.)
# 3. Implement authentication and authorization
# 4. Add input validation and serialization
# 5. Implement proper error handling and logging
# 6. Add API versioning
# 7. Implement rate limiting and security measures
# 8. Add comprehensive testing suite
# ============================================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
# TODO: Add these imports as the app scales:
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
# from flask_jwt_extended import JWTManager
# from flask_limiter import Limiter
# from flask_limiter.util import get_remote_address
# import logging
# from datetime import datetime
# import os
# from dotenv import load_dotenv

# ============================================================================
# APPLICATION SETUP
# ============================================================================
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# TODO: Add configuration management
# load_dotenv()
# app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

# TODO: Initialize extensions as features are added:
# db = SQLAlchemy(app)
# migrate = Migrate(app, db)
# jwt = JWTManager(app)
# limiter = Limiter(
#     app,
#     key_func=get_remote_address,
#     default_limits=["200 per day", "50 per hour"]
# )

# TODO: Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# ============================================================================
# DATABASE MODELS (TODO: Move to separate models.py file)
# ============================================================================
# TODO: Create database models for scaling:
# class User(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(80), unique=True, nullable=False)
#     email = db.Column(db.String(120), unique=True, nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
#     quiz_results = db.relationship('QuizResult', backref='user', lazy=True)

# class Question(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     question_text = db.Column(db.Text, nullable=False)
#     correct_answer = db.Column(db.Float, nullable=False)
#     difficulty = db.Column(db.String(20), default='easy')
#     category = db.Column(db.String(50), default='math')
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)

# class QuizResult(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
#     question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
#     user_answer = db.Column(db.Float, nullable=False)
#     is_correct = db.Column(db.Boolean, nullable=False)
#     time_taken = db.Column(db.Float)  # seconds
#     submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

# ============================================================================
# VALIDATION & SERIALIZATION (TODO: Move to separate schemas.py file)
# ============================================================================
# TODO: Add input validation using marshmallow or pydantic:
# from marshmallow import Schema, fields, ValidationError

# class AnswerSchema(Schema):
#     answer = fields.Float(required=True, validate=lambda x: x is not None)

# answer_schema = AnswerSchema()

# ============================================================================
# ERROR HANDLERS
# ============================================================================
# TODO: Implement comprehensive error handling:
# @app.errorhandler(400)
# def bad_request(error):
#     return jsonify({'error': 'Bad request', 'message': str(error)}), 400

# @app.errorhandler(401)
# def unauthorized(error):
#     return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401

# @app.errorhandler(404)
# def not_found(error):
#     return jsonify({'error': 'Not found', 'message': 'Resource not found'}), 404

# @app.errorhandler(429)
# def rate_limit_exceeded(error):
#     return jsonify({'error': 'Rate limit exceeded', 'message': 'Too many requests'}), 429

# @app.errorhandler(500)
# def internal_error(error):
#     db.session.rollback()
#     return jsonify({'error': 'Internal server error', 'message': 'Something went wrong'}), 500

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/check', methods=['POST'])
# TODO: Add rate limiting: @limiter.limit("10 per minute")
def check_answer():
    """
    Check if the submitted answer is correct.
    
    TODO: Add comprehensive documentation with Swagger/OpenAPI
    TODO: Add authentication requirement
    TODO: Add input validation
    TODO: Add logging for analytics
    """
    try:
        # TODO: Add request logging
        # logger.info(f"Answer check request from {request.remote_addr}")
        
        # TODO: Validate input using schema
        # try:
        #     data = answer_schema.load(request.get_json())
        # except ValidationError as err:
        #     return jsonify({'error': 'Validation error', 'details': err.messages}), 400
        
        data = request.get_json()
        
        if not data or 'answer' not in data:
            return jsonify({
                'success': False,
                'message': 'Invalid request format'
            }), 400
        
        answer = data['answer']
        
        # TODO: Make this dynamic - load from database
        # TODO: Add support for different question types
        # TODO: Add difficulty levels
        # TODO: Add time tracking
        # TODO: Add scoring system
        
        # Check if the answer is 2
        if answer == 2:
            # TODO: Log successful answer
            # TODO: Save to database if user is authenticated
            # TODO: Calculate and return score
            return jsonify({
                'success': True,
                'message': 'Hello World'
            })
        else:
            # TODO: Log incorrect answer
            # TODO: Provide hints for wrong answers
            # TODO: Track common wrong answers for analytics
            return jsonify({
                'success': False,
                'message': 'Wrong answer'
            })
    
    except Exception as e:
        # TODO: Implement proper error logging
        # logger.error(f"Error in check_answer: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': 'Server error'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring.
    
    TODO: Add database connectivity check
    TODO: Add external service health checks
    TODO: Add system metrics (memory, CPU, etc.)
    """
    # TODO: Add comprehensive health checks:
    # try:
    #     # Check database connection
    #     db.session.execute('SELECT 1')
    #     db_status = 'healthy'
    # except Exception as e:
    #     db_status = f'unhealthy: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        # TODO: Add more health information:
        # 'database': db_status,
        # 'timestamp': datetime.utcnow().isoformat(),
        # 'version': '1.0.0'
    })

# ============================================================================
# TODO: ADD MORE API ENDPOINTS FOR SCALING
# ============================================================================

# TODO: User management endpoints
# @app.route('/api/v1/users', methods=['POST'])
# def create_user():
#     """Create a new user account"""
#     pass

# @app.route('/api/v1/users/<int:user_id>', methods=['GET'])
# @jwt_required()
# def get_user(user_id):
#     """Get user profile"""
#     pass

# TODO: Question management endpoints
# @app.route('/api/v1/questions', methods=['GET'])
# def get_questions():
#     """Get list of questions with pagination"""
#     pass

# @app.route('/api/v1/questions/<int:question_id>', methods=['GET'])
# def get_question(question_id):
#     """Get specific question"""
#     pass

# @app.route('/api/v1/questions', methods=['POST'])
# @jwt_required()
# @admin_required()
# def create_question():
#     """Create new question (admin only)"""
#     pass

# TODO: Quiz management endpoints
# @app.route('/api/v1/quiz/start', methods=['POST'])
# @jwt_required()
# def start_quiz():
#     """Start a new quiz session"""
#     pass

# @app.route('/api/v1/quiz/submit', methods=['POST'])
# @jwt_required()
# def submit_quiz():
#     """Submit quiz answers"""
#     pass

# @app.route('/api/v1/quiz/results/<int:quiz_id>', methods=['GET'])
# @jwt_required()
# def get_quiz_results(quiz_id):
#     """Get quiz results"""
#     pass

# TODO: Analytics endpoints
# @app.route('/api/v1/analytics/performance', methods=['GET'])
# @jwt_required()
# @admin_required()
# def get_performance_analytics():
#     """Get performance analytics (admin only)"""
#     pass

# ============================================================================
# AUTHENTICATION & AUTHORIZATION (TODO: Implement)
# ============================================================================
# TODO: Add JWT authentication
# @jwt.user_identity_loader
# def user_identity_lookup(user):
#     return user.id

# @jwt.user_lookup_loader
# def user_lookup_callback(_jwt_header, jwt_data):
#     identity = jwt_data["sub"]
#     return User.query.filter_by(id=identity).one_or_none()

# TODO: Add role-based access control
# def admin_required():
#     def wrapper(fn):
#         @wraps(fn)
#         def decorator(*args, **kwargs):
#             current_user = get_jwt_identity()
#             user = User.query.get(current_user)
#             if user.role != 'admin':
#                 return jsonify({'error': 'Admin access required'}), 403
#             return fn(*args, **kwargs)
#         return decorator
#     return wrapper

# ============================================================================
# APPLICATION STARTUP
# ============================================================================
if __name__ == '__main__':
    # TODO: Add database initialization
    # with app.app_context():
    #     db.create_all()
    
    # TODO: Use proper WSGI server for production
    # gunicorn -w 4 -b 0.0.0.0:5001 app:app
    app.run(debug=True, port=5001)

# ============================================================================
# SCALING ROADMAP
# ============================================================================
"""
SCALING RECOMMENDATIONS:

1. PROJECT STRUCTURE:
   - Create proper package structure (app/, models/, routes/, services/)
   - Implement blueprints for route organization
   - Add configuration management with environment variables
   - Implement factory pattern for app creation

2. DATABASE INTEGRATION:
   - Add PostgreSQL or MongoDB for data persistence
   - Implement database migrations
   - Add connection pooling
   - Implement database indexing for performance

3. AUTHENTICATION & SECURITY:
   - Implement JWT-based authentication
   - Add password hashing and validation
   - Implement role-based access control
   - Add rate limiting and request throttling
   - Implement CORS policies
   - Add input sanitization and validation

4. API DESIGN:
   - Implement RESTful API design principles
   - Add API versioning
   - Implement proper HTTP status codes
   - Add comprehensive error handling
   - Implement request/response logging

5. TESTING:
   - Add unit tests with pytest
   - Implement integration tests
   - Add API endpoint testing
   - Implement test database setup
   - Add test coverage reporting

6. MONITORING & LOGGING:
   - Implement structured logging
   - Add application metrics
   - Implement health checks
   - Add performance monitoring
   - Implement error tracking (Sentry)

7. DEPLOYMENT:
   - Containerize with Docker
   - Add CI/CD pipeline
   - Implement environment-specific configurations
   - Add database backup strategies
   - Implement load balancing

8. PERFORMANCE:
   - Add caching (Redis)
   - Implement database query optimization
   - Add API response compression
   - Implement background task processing
   - Add CDN for static assets

9. FEATURES TO ADD:
   - User registration and profiles
   - Question bank management
   - Quiz creation and customization
   - Progress tracking and analytics
   - Social features (leaderboards, sharing)
   - Mobile app API support
   - Real-time features (WebSockets)
   - File upload for questions
   - Email notifications
   - Payment integration for premium features
"""
