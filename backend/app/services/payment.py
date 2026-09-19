import os
import uuid
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Fetch API keys (will be used in real implementation)
RAZORPAY_KEY = os.environ.get("RAZORPAY_KEY")
RAZORPAY_SECRET = os.environ.get("RAZORPAY_SECRET")

def create_booking_order(booking_id: str, amount_paise: int, therapist_account_id: str) -> Optional[Dict[str, Any]]:
    """
    Creates a Razorpay Order with transfers for the 88/12 split.
    MOCKED implementation until actual Razorpay integration.
    """
    
    # 88% to therapist, 12% to platform
    therapist_share = int(amount_paise * 0.88)
    
    logger.info(f"MOCK: Creating Razorpay order for {booking_id}. Total: {amount_paise} paise. Therapist gets {therapist_share} (Account: {therapist_account_id})")
    
    mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
    
    return {
        "id": mock_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "receipt": booking_id,
        "status": "created",
        "transfers": [
            {
                "account": therapist_account_id,
                "amount": therapist_share,
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
