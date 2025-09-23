import os
import logging
from datetime import datetime, date
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Configure Gemini API
# NOTE: The API key is stored in the environment variables.
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-pro-latest')

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

# Database Models
class DailyTillRecord(db.Model):
    __tablename__ = 'daily_till_records'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Total amounts
    total_cash = db.Column(db.Numeric(10, 2), nullable=False)
    float_total = db.Column(db.Numeric(10, 2), nullable=False)
    takings = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Expected takings comparison
    expected_takings = db.Column(db.Numeric(10, 2))
    
    # Notes
    note50_count = db.Column(db.Integer, default=0)
    note20_count = db.Column(db.Integer, default=0)
    note10_count = db.Column(db.Integer, default=0)
    note5_count = db.Column(db.Integer, default=0)
    
    # Coins
    coin200_count = db.Column(db.Integer, default=0)
    coin100_count = db.Column(db.Integer, default=0)
    coin50_count = db.Column(db.Integer, default=0)
    coin20_count = db.Column(db.Integer, default=0)
    coin10_count = db.Column(db.Integer, default=0)
    coin5_count = db.Column(db.Integer, default=0)
    coin2_count = db.Column(db.Integer, default=0)
    coin1_count = db.Column(db.Integer, default=0)
    
    # Float denominations
    float_note20_count = db.Column(db.Integer, default=0)
    float_note10_count = db.Column(db.Integer, default=0)
    float_note5_count = db.Column(db.Integer, default=0)
    float_coin200_count = db.Column(db.Integer, default=0)
    float_coin100_count = db.Column(db.Integer, default=0)
    float_coin50_count = db.Column(db.Integer, default=0)
    float_coin20_count = db.Column(db.Integer, default=0)
    float_coin10_count = db.Column(db.Integer, default=0)
    float_coin5_count = db.Column(db.Integer, default=0)
    float_coin2_count = db.Column(db.Integer, default=0)
    float_coin1_count = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'total_cash': float(self.total_cash),
            'float_total': float(self.float_total),
            'takings': float(self.takings),
            'expected_takings': float(self.expected_takings) if self.expected_takings else None,
            'denominations': {
                'note50': self.note50_count,
                'note20': self.note20_count,
                'note10': self.note10_count,
                'note5': self.note5_count,
                'coin200': self.coin200_count,
                'coin100': self.coin100_count,
                'coin50': self.coin50_count,
                'coin20': self.coin20_count,
                'coin10': self.coin10_count,
                'coin5': self.coin5_count,
                'coin2': self.coin2_count,
                'coin1': self.coin1_count
            },
            'float_denominations': {
                'floatNote20': self.float_note20_count,
                'floatNote10': self.float_note10_count,
                'floatNote5': self.float_note5_count,
                'floatCoin200': self.float_coin200_count,
                'floatCoin100': self.float_coin100_count,
                'floatCoin50': self.float_coin50_count,
                'floatCoin20': self.float_coin20_count,
                'floatCoin10': self.float_coin10_count,
                'floatCoin5': self.float_coin5_count,
                'floatCoin2': self.float_coin2_count,
                'floatCoin1': self.float_coin1_count
            }
        }

# API endpoint to save or update a till record
@app.route('/api/records', methods=['POST'])
def save_record():
    try:
        data = request.json
        record_date_str = data.get('date')

        if record_date_str:
            record_date = datetime.strptime(record_date_str, '%Y-%m-%d').date()
        else:
            record_date = date.today()

        existing_record = DailyTillRecord.query.filter_by(date=record_date).first()

        denominations = data.get('denominations')
        floats = data.get('floats')

        if existing_record:
            logging.info(f"Updating existing record for {record_date}")
            existing_record.total_cash = data.get('totalCash')
            existing_record.float_total = data.get('floatTotal')
            existing_record.takings = data.get('takings')
            existing_record.expected_takings = data.get('expectedTakings')
            for key, value in denominations.items():
                setattr(existing_record, f"{key}_count", value)
            for key, value in floats.items():
                setattr(existing_record, f"float_{key}_count", value)
        else:
            logging.info(f"Creating new record for {record_date}")
            new_record = DailyTillRecord(
                date=record_date,
                total_cash=data.get('totalCash'),
                float_total=data.get('floatTotal'),
                takings=data.get('takings'),
                expected_takings=data.get('expectedTakings'),
                note50_count=denominations.get('note50'),
                note20_count=denominations.get('note20'),
                note10_count=denominations.get('note10'),
                note5_count=denominations.get('note5'),
                coin200_count=denominations.get('coin200'),
                coin100_count=denominations.get('coin100'),
                coin50_count=denominations.get('coin50'),
                coin20_count=denominations.get('coin20'),
                coin10_count=denominations.get('coin10'),
                coin5_count=denominations.get('coin5'),
                coin2_count=denominations.get('coin2'),
                coin1_count=denominations.get('coin1'),
                float_note20_count=floats.get('floatNote20'),
                float_note10_count=floats.get('floatNote10'),
                float_note5_count=floats.get('floatNote5'),
                float_coin200_count=floats.get('floatCoin200'),
                float_coin100_count=floats.get('floatCoin100'),
                float_coin50_count=floats.get('floatCoin50'),
                float_coin20_count=floats.get('floatCoin20'),
                float_coin10_count=floats.get('floatCoin10'),
                float_coin5_count=floats.get('floatCoin5'),
                float_coin2_count=floats.get('floatCoin2'),
                float_coin1_count=floats.get('floatCoin1')
            )
            db.session.add(new_record)
        
        db.session.commit()
        return jsonify({'message': 'Record saved successfully!', 'record': existing_record.to_dict() if existing_record else new_record.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Failed to save record: {e}")
        return jsonify({'error': 'Failed to save record'}), 500

# API endpoint to get the latest till record
@app.route('/api/records/latest', methods=['GET'])
def get_latest_record():
    try:
        record = DailyTillRecord.query.order_by(DailyTillRecord.date.desc()).first()
        if record:
            return jsonify(record.to_dict()), 200
        else:
            return jsonify({'message': 'No records found'}), 404
    except Exception as e:
        logging.error(f"Failed to fetch record: {e}")
        return jsonify({'error': 'Failed to fetch record'}), 500

# API endpoint to get a specific record by date
@app.route('/api/records', methods=['GET'])
def get_record_by_date():
    try:
        date_str = request.args.get('date')
        if not date_str:
            # If no date is provided, return the latest record (for compatibility)
            return get_latest_record()

        record_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        record = DailyTillRecord.query.filter_by(date=record_date).first()

        if record:
            return jsonify(record.to_dict()), 200
        else:
            return jsonify({'message': 'No record found for this date'}), 404
    except Exception as e:
        logging.error(f"Failed to fetch record by date: {e}")
        return jsonify({'error': 'Failed to fetch record'}), 500

# New API endpoint for generating a summary
@app.route('/api/generate-summary', methods=['POST'])
def generate_summary():
    try:
        data = request.json
        takings = data.get('takings', 0)
        expected = data.get('expectedTakings', 0)
        float_total = data.get('floatTotal', 0)
        total_cash = data.get('totalCash', 0)

        # Create the prompt for the LLM
        prompt = f"""
        Act as a retail manager analyzing the end-of-day till count.
        Provide a concise, single-paragraph summary of the day's performance.

        Here is the data:
        - Total Cash in Till: £{total_cash:.2f}
        - Total Takings (to be removed): £{takings:.2f}
        - Expected Takings: £{expected:.2f}
        - Float for Tomorrow: £{float_total:.2f}

        Based on this data, write a summary.
        If the total takings are exactly the expected takings, mention that performance was 'perfect'.
        If there is a positive variance, mention that performance was 'excellent'.
        If there is a negative variance, mention that there was a 'shortage'.
        Always mention the total takings, and if an expected takings amount was provided, mention the variance.
        If the float is exactly £200.00, mention that the float was 'correct'.
        """

        response = model.generate_content(prompt)
        summary = response.text
        
        return jsonify({'summary': summary}), 200
        
    except Exception as e:
        logging.error(f"Failed to generate summary: {e}")
        return jsonify({'error': 'Failed to generate summary'}), 500

@app.route('/')
def index():
    """Main page for the till counter application."""
    return render_template('index.html')

with app.app_context():
    try:
        db.create_all()
        logging.info("Database connection successful and tables created")
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        logging.warning("App will start without database connection - some features may not work")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
