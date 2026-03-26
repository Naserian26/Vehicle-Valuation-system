import datetime
import secrets
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity, verify_jwt_in_request
from flask_mail import Message
from bson.objectid import ObjectId
from database import mongo
from extensions import mail

admin = Blueprint('admin', __name__)

# ==========================
# ✅ SESSION VALIDATOR
# ==========================
@admin.before_request
def validate_session():
    try:
        verify_jwt_in_request()
    except:
        return

    try:
        user_id = get_jwt_identity()
        current_token = request.headers.get('Authorization', '').replace('Bearer ', '')

        user = mongo.db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"active_token": 1}
        )

        if not user:
            return jsonify({"message": "User not found"}), 401

        stored_token = user.get('active_token')
        if not stored_token:
            return

        if stored_token != current_token:
            return jsonify({"message": "Session expired. Please login again."}), 401

    except Exception as e:
        return

# ==========================
# LOGGING HELPER
# ==========================
def log_event(level, event, message, user=None, ip=None, role=None, extra=None):
    entry = {
        "level": level,
        "event": event,
        "message": message,
        "user": user,
        "ip": ip,
        "role": role,
        "timestamp": datetime.datetime.utcnow(),
    }
    if extra:
        entry.update(extra)
    try:
        mongo.db.logs.insert_one(entry)
    except Exception as e:
        print(f"[LOG ERROR] Failed to save log: {e}")

def get_client_ip():
    return request.headers.get('X-Forwarded-For', request.remote_addr)

# ==========================
# 1. GET LOGS
# ==========================
@admin.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    claims = get_jwt()
    user_role = claims.get('role', '')

    if user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Access denied"}), 403

    level  = request.args.get('level')
    event  = request.args.get('event')
    limit  = int(request.args.get('limit', 500))

    query = {}
    if level and level != 'ALL':
        query['level'] = level
    if event and event != 'ALL':
        query['event'] = event

    raw_logs = list(
        mongo.db.logs.find(query)
        .sort('timestamp', -1)
        .limit(limit)
    )

    logs = []
    for log in raw_logs:
        log['_id'] = str(log['_id'])
        if isinstance(log.get('timestamp'), datetime.datetime):
            log['timestamp'] = log['timestamp'].isoformat()
        logs.append(log)

    return jsonify({"logs": logs, "total": len(logs)}), 200

# ==========================
# 2. GET EMAILS / INVITES
# ==========================
@admin.route('/emails', methods=['GET'])
@jwt_required()
def get_emails():
    claims = get_jwt()
    user_role = claims.get('role', '')

    if user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Access denied"}), 403

    raw_invites = list(mongo.db.invites.find().sort('created_at', -1))

    invites = []
    for inv in raw_invites:
        inv['_id'] = str(inv['_id'])
        if isinstance(inv.get('created_at'), datetime.datetime):
            inv['created_at'] = inv['created_at'].isoformat()
        if isinstance(inv.get('expires_at'), datetime.datetime):
            inv['expires_at'] = inv['expires_at'].isoformat()
        invites.append(inv)

    return jsonify({"invites": invites, "total": len(invites)}), 200

# ==========================
# 3. RESEND INVITE
# ==========================
@admin.route('/emails/resend', methods=['POST'])
@jwt_required()
def resend_invite():
    claims       = get_jwt()
    user_role    = claims.get('role', '')
    current_user = get_jwt_identity()

    if user_role not in ['super_admin', 'business_admin']:
        return jsonify({"message": "Access denied"}), 403

    data      = request.json
    invite_id = data.get('invite_id')
    email     = data.get('email')

    if not invite_id or not email:
        return jsonify({"message": "invite_id and email are required"}), 400

    # ── FETCH INVITE FIRST ────────────────────────────────────
    invite = mongo.db.invites.find_one({"_id": ObjectId(invite_id)})
    if not invite:
        return jsonify({"message": "Invite not found"}), 404

    # ── ROLE ENFORCEMENT ──────────────────────────────────────
    # business_admin cannot resend an invite originally created
    # for business_admin — that would bypass their invite restrictions
    if user_role == 'business_admin' and invite.get('role') != 'viewer':
        log_event(
            level="WARNING",
            event="unauthorized_access",
            message=f"Business Admin attempted to resend a '{invite.get('role')}' invite to {email}",
            user=current_user,
            ip=get_client_ip(),
            role=user_role
        )
        return jsonify({"message": "Business Admin can only resend Viewer invites"}), 403
    # ─────────────────────────────────────────────────────────

    new_token  = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    mongo.db.invites.update_one(
        {"_id": ObjectId(invite_id)},
        {"$set": {
            "token":      new_token,
            "expires_at": expires_at,
            "used":       False,
            "resent_at":  datetime.datetime.utcnow(),
            "resent_by":  current_user
        }}
    )

    # use the invite's actual role in the email body
    role_label = "Business Admin" if invite.get('role') == 'business_admin' else "Viewer"
    invite_link = f"http://localhost:5173/register?token={new_token}"
    email_body  = (
        f"You have been re-invited to join as {role_label}.\n"
        f"Click here to register: {invite_link}\n\n"
        f"This link expires in 24 hours."
    )

    try:
        msg = Message("Invitation to Vehicle Valuation", recipients=[email])
        msg.body = email_body
        mail.send(msg)
        email_sent = True
    except Exception as e:
        print(f"Email error: {e}")
        email_sent = False

    log_event(
        level="INFO",
        event="invite_resent",
        message=f"Invite resent to {email} for role '{invite.get('role')}'",
        user=current_user,
        ip=get_client_ip(),
        role=user_role
    )

    if email_sent:
        return jsonify({"message": f"Invite resent to {email} successfully"}), 200
    else:
        return jsonify({"message": "Invite updated but email failed to send. Check mail config."}), 207