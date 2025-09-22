import os
import logging
from datetime import datetime, date
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)

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

@app.route('/')
def index():
    """Main page for the till counter application."""
    return render_template('index.html')




# Create database tables - handle connection errors gracefully
with app.app_context():
    try:
        # Test database connection and create tables
        db.create_all()
        logging.info("Database connection successful and tables created")
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        logging.warning("App will start without database connection - some features may not work")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
