import os
import uuid
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Fetch API keys (will be used in real implementation)
RAZORPAY_KEY = os.environ.get("RAZORPAY_KEY")
RAZORPAY_SECRET = os.environ.get("RAZORPAY_SECRET")

def calculate_platform_fees(base_amount_paise: int) -> Dict[str, int]:
    """
    Calculates the standard Option C fee structure:
    - Parent pays base + 5% platform fee
    - Therapist earns base - 12% platform fee
    - Platform keeps the difference
    """
    parent_fee = int(base_amount_paise * 0.05)
    total_parent_pays = base_amount_paise + parent_fee
    
    therapist_fee = int(base_amount_paise * 0.12)
    therapist_gets = base_amount_paise - therapist_fee
    
    return {
        "base_amount": base_amount_paise,
        "parent_total": total_parent_pays,
        "parent_fee": parent_fee,
        "therapist_payout": therapist_gets,
        "therapist_fee": therapist_fee,
        "total_platform_revenue": parent_fee + therapist_fee
    }

def create_booking_order(booking_id: str, base_amount_paise: int, therapist_account_id: str) -> Optional[Dict[str, Any]]:
    """
    Creates a Razorpay Order with transfers.
    MOCKED implementation until actual Razorpay integration.
    """
    
    fees = calculate_platform_fees(base_amount_paise)
    
    logger.info(f"MOCK: Creating Razorpay order for {booking_id}. Parent pays: {fees['parent_total']} paise (Base: {fees['base_amount']} + Fee: {fees['parent_fee']}). Therapist gets {fees['therapist_payout']} (Account: {therapist_account_id})")
    
    mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
    
    return {
        "id": mock_order_id,
        "amount": fees['parent_total'], # Charge parent the total amount
        "currency": "INR",
        "receipt": booking_id,
        "status": "created",
        "transfers": [
            {
                "account": therapist_account_id,
                "amount": fees['therapist_payout'], # Transfer net earnings to therapist
                "currency": "INR"
            }
        ]
    }

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, signature: str) -> bool:
    """
    Verifies the Razorpay payment signature.
    MOCKED implementation.
    """
    logger.info(f"MOCK: Verifying payment signature for order {razorpay_order_id}")
    return True
