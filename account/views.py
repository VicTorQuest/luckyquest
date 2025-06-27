import json
import qrcode
import time
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from pycoingecko import CoinGeckoAPI
from uuid import uuid4
from django.conf import settings
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.humanize.templatetags.humanize import intcomma
from django.core.mail import EmailMultiAlternatives, send_mail
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.template.loader import get_template
from django.urls import reverse
from account.models import User, Referral, Wallet, OtpVerification
from notifications_center.models import BroadcastNotification, UserNotification
from payments.models import Transaction, ReferralBonus, DepositIssue
from website.models import WebsiteSocialLink, RedemptionCode, AllAdminWallets, CurrentSiteWallet
from .thread import SendThreadEmail
from .utils import is_valid_phone_number, handle_referral, add_daily_login_reward



cg = CoinGeckoAPI()
site_name = getattr(settings, 'SITE_NAME', 'luckyquest')
no_reply_email = getattr(settings, 'APPLICATION_EMAIL', 'Trust Safe Incorporation <no_reply@trustsafeinc.com>')
website_logo = getattr(settings, 'WEBSITE_LOGO', 'https://iili.io/dkpvy8P.png')
support_email = getattr(settings, 'SUPPORT_EMAIL', 'support@luckyquest.com')
admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@luckyquest.com')
support_mail = 'support@luckyquest.com'




# Create your views here.

def generate_qr_code(request):
    url = "https://" + request.get_host() + "/register/" + request.user.referral.invitation_code

    # Create a QR code instance
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Generate the image
    img = qr.make_image(fill_color=(116, 77, 160), back_color="white")

    # Save the image in memory
    buffer = BytesIO()
    img.save(buffer)
    buffer.seek(0)

    # Return the image as an HTTP response
    return HttpResponse(buffer.getvalue(), content_type="image/png")


def home(request):
    try:
        user = User.objects.get(username="admin@luckyquest.com")
        social_link = WebsiteSocialLink.objects.get(host=user)
        telegram_channel = social_link.telegram_channel
        telegram_customer_service = social_link.telegram_customer_service
    except:
        telegram_channel = 'https://t.me/luckyquest'
        telegram_customer_service = 'https://t.me/luckyquestmallcom'
    return render(request, 'account/home.html', {
        'telegram_channel': telegram_channel,
        'telegram_customer_service': telegram_customer_service
    })


def register(request, *args, **kwargs):
    # if request.user.is_authenticated:
    #     return redirect('home')
    code = kwargs.get('inv_code')
    if code:
        inv_code = code
    else:
        inv_code = ''
    return render(request, 'account/register.html', {
        'inv_code': inv_code
    })

def register_user(request):
    data = json.loads(request.body)
    reg_type = data.get('reg_type')
    account_id = data.get('account_id')
    password = data.get('password')
    invitation_code = data.get('invitation_code').lower()
    
    try:
        invitation = Referral.objects.get(invitation_code=invitation_code)
        if reg_type == 'email':
            user_exists = User.objects.filter(username=account_id).exists()        
            if user_exists:
                return JsonResponse({'status': 'error', 'message': 'This user is already registered'}, status=409)
            
            created_user = User.objects.create_user(username=account_id.lower(), email=account_id, password=password)
            # update referrals
            handle_referral(Referral, ReferralBonus, created_user, invitation)
            login(request, user=created_user)

        elif reg_type == 'phone_number':
            user_exists = User.objects.filter(username=account_id).exists()        
            if user_exists:
                return JsonResponse({'status': 'error', 'message': 'This user is already registered'}, status=409)
            if is_valid_phone_number(account_id):
                created_user = User.objects.create_user(username=account_id, phone_number=account_id, password=password)
                # update referrals
                handle_referral(Referral, ReferralBonus, created_user, invitation)
                login(request, user=created_user)
            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid phone number'}, status=400)

    except Referral.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Invalid invitation code'}, status=404)
        



    response = JsonResponse({'status': 'success', 'message': 'user registered sucessfully', 'url_redirect': reverse(home)}, status=200)
    response.set_cookie(
        key='new_registeration',
        value=True,
        max_age=3600,
        samesite='Lax'
    )
    return response




def sign_in(request):
    next_param = request.GET.get('next')
    return render(request, 'account/sign_in.html', {
        'next_param': next_param
    })

def sign_in_user(request):
    data = json.loads(request.body)
    account_id = data.get('account_id')
    password =data.get('password')
    next_param = data.get('next_param')
    

    user = authenticate(request, username=account_id, password=password)
    if user != None:
        login(request, user)
        url_redirect = next_param if next_param != 'None' else reverse('home')
        notification = UserNotification.objects.create(user=user, notification_type='LOGIN NOTIFICATION', message=f'Your account was logged in on')
        notification.message = f"Your account was logged in on {notification.notified_on.strftime('%Y-%m-%d, %I:%M %p.').lower().capitalize()}"
        notification.save()

        daily_spin = add_daily_login_reward(user)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid login credentials'}, status=401)


    response = JsonResponse({'status': 'success', 'message': 'Sucessfully signed in', 'url_redirect': url_redirect}, status=200)
    if daily_spin:
        response.set_cookie(
            'daily_login', 
            True, 
            max_age=3600, 
            secure=True, 
            httponly=False, 
            samesite='Lax'
        )
    return response

@login_required
def wallet(request):
    user = request.user
    transactions = Transaction.objects.filter(user=user)[:3]
    deposits = Transaction.objects.filter(user=user, transaction_type='DEPOSIT')[:3]

    withdrawals = Transaction.objects.filter(user=user, transaction_type='WITHDRAWAL')[:3]

    return render(request, 'account/wallet.html', {
        'deposits': deposits,
        'withdrawals': withdrawals,
        'transactions': transactions
    })

@login_required
def withdraw_referral_bonus(request):
    user = request.user
    wallet = Wallet.objects.get(user=user)
    referral = Referral.objects.get(user=user)

    amount = referral.total_referral_bonus

    if not amount > 0:
        return JsonResponse({'message': 'Insufficient bonus'}, status=402)

    wallet.balance += amount
    wallet.save()
    referral.total_referral_bonus -= amount
    referral.save()


    balance = intcomma(wallet.balance)
    referral_bonus = referral.total_referral_bonus


    return JsonResponse({'balance': balance, 'referral_bonus': referral_bonus}, status=200)

@login_required
def deposit(request):
    user = request.user
    deposits = Transaction.objects.filter(user=user, transaction_type='DEPOSIT')[:3]
    return render(request, 'account/deposit.html', {
        'deposits': deposits
    })

@login_required
def start_deposit(request):
    data = json.loads(request.body)
    user = request.user
    amount = int(data.get('amount'))
    network = data.get('network')

    pending_transactions = Transaction.objects.filter(user=user, transaction_type='DEPOSIT', status='Pending')
    if pending_transactions.exists():
        return JsonResponse({'message': 'You stlll have a pending deposit'}, status=402)

    try:
        usdt = cg.get_price(ids='tether', vs_currencies='usd') 
        calc = usdt['tether']['usd']
        value = round(amount / calc, 8) 
    except:
        return JsonResponse({'message': 'Request Timeout'}, status=408)

    transaction = Transaction.objects.create(user=user, amount=amount, value=value)

    url = reverse('process_deposit', kwargs={'transaction_id': transaction.transaction_id}) + f"?network={network}"


    return JsonResponse({'url': url}, status=200)

@login_required
def process_deposit(request, transaction_id):
    transaction = get_object_or_404(Transaction, transaction_id=transaction_id)
    domain_name = request.get_host()
    network = request.GET.get('network')
    site_user  = User.objects.get(username='admin@luckyquest.com')
    site_wallet = AllAdminWallets.objects.get(admin_account=site_user)

    wallet = CurrentSiteWallet.objects.get(wallet=site_wallet)
    exchange_rate = transaction.amount / Decimal(transaction.value)

    return render(request, 'account/process_order.html', {
        'transaction': transaction,
        'domain_name': domain_name,
        'wallet': wallet.wallet,
        'exchange_rate': exchange_rate,
        'network': network
    })


@login_required
def submit_payment_proof(request):
    transaction_id = request.POST.get('transaction_id')
    proof = request.FILES.get('payment_proof')
    try:
        transaction = Transaction.objects.get(transaction_id=transaction_id)
    except Transaction.DoesNotExist:
        return JsonResponse({'message': 'Unauthorised transaction'}, status=404)
    
    transaction.proof_of_payment = proof
    transaction.save()

    url = reverse('deposit_history')
    return JsonResponse({'url': url}, status=200)


def update_invoice_status(request):
    if request.method == "POST":
        transaction_id = request.POST.get('transaction_id')
        transaction = get_object_or_404(Transaction, transaction_id=transaction_id)
        transaction.status = 'Failed'
        transaction.save()
    return JsonResponse({'status': 'Good'}, status=200)


@login_required
def deposit_issue(request):
    user = request.user
    orders = Transaction.objects.filter(user=user, approved=False)

    return render(request, 'account/deposit_issue.html', {
        'orders': orders
    })


@login_required
def deposit_history(request):
    user = request.user
    deposits = Transaction.objects.filter(user=user,  transaction_type='DEPOSIT')
    return render(request, 'account/deposit_history.html', {
        'deposits': deposits
    })


@login_required
def filter_deposits_by_date(request):
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    deposits = []

    qs = Transaction.objects.filter(user=user, transaction_type='DEPOSIT', date__range=(start_date, end_date))
    for i in qs:
        deposit = {'amount': intcomma(i.amount), 'status': i.status, 'date': i.date.strftime("%b. %d, %Y, %I:%M %p").replace("PM", "p.m.").replace("am", "a.m."), 'transaction_id': i.transaction_id}
        deposits.append(deposit)
    return JsonResponse({'deposits': deposits}, status=200)


@login_required
def filter_deposits_by_status(request):
    user = request.user
    status = request.GET.get('status')

    deposits = []

    qs = Transaction.objects.filter(user=user, transaction_type='DEPOSIT', status=status)

    for i in qs:
        deposit = {'amount': intcomma(i.amount), 'status': i.status, 'date': i.date.strftime("%b. %d, %Y, %I:%M %p").replace("PM", "p.m.").replace("am", "a.m."), 'transaction_id': i.transaction_id}
        deposits.append(deposit)


    return JsonResponse({'deposits': deposits}, status=200)


@login_required
def transactions(request):
    user = request.user
    transactions = Transaction.objects.filter(user=user)
    return render(request, 'account/transactions.html', {
        'transactions': transactions
    })


@login_required
def filter_transation_by_status(request):
    user = request.user
    status = request.GET.get('status')

    transactions = []
    qs = Transaction.objects.filter(user=user, status=status)
    for i in qs:
        transaction = {'transaction_type': i.transaction_type, 'amount': intcomma(i.amount), 'status': i.status, 'date': i.date.strftime("%b. %d, %Y, %I:%M %p").replace("PM", "p.m.").replace("am", "a.m."), 'transaction_id': i.transaction_id, 'symbol': '-' if i.transaction_type == 'WITHDRAWAL' else '+'}
        transactions.append(transaction) 
    return JsonResponse({'transactions': transactions}, status=200)

@login_required
def filter_transaction_by_date(request):
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    transactions = []
    qs = Transaction.objects.filter(user=user, date__range=(start_date, end_date))
    for i in qs:
        transaction = {'transaction_type': i.transaction_type, 'amount': intcomma(i.amount), 'status': i.status, 'date': i.date.strftime("%b. %d, %Y, %I:%M %p").replace("PM", "p.m.").replace("am", "a.m."), 'transaction_id': i.transaction_id, 'symbol': '-' if i.transaction_type == 'WITHDRAWAL' else '+'}
        transactions.append(transaction) 
    return JsonResponse({'transactions': transactions}, status=200)


@login_required
def submit_deposit_issue(request):
    user = request.user
    transaction_id = request.POST.get('ordernumber')
    transction_reference_number = request.POST.get('trn')
    recipient_account = request.POST.get('recipient_account')
    message = request.POST.get('message')
    proof_of_payment = request.FILES.get('proof')
    try:
        transaction = Transaction.objects.get(transaction_id=transaction_id)
    except:
        return JsonResponse({'message': 'Order does not exist'}, status=404)
    

    send_mail(f'Deposit issue from {user.username}', message, user.username, [support_email], fail_silently=False)


    DepositIssue.objects.create(user=user, transaction=transaction, transction_reference_number=transction_reference_number, recipient_bank_account=recipient_account, message=message, proof_of_payment=proof_of_payment)


    return JsonResponse({}, status=200)

@login_required
def withdrawal(request):
    user = request.user
    withdrawals = Transaction.objects.filter(user=user, transaction_type='WITHDRAWAL')[:3]
    return render(request, 'account/withdrawal.html', {
        'withdrawals': withdrawals
    })



@login_required
def start_withdrawal(request):
    user=request.user
    data = json.loads(request.body)
    bank_name = data.get('bank_name')
    recipient_name = data.get('recipient_name')
    account_number = data.get('account_number')
    phone_number = data.get('phone_number')
    email_address = data.get('email_address')
    amount = Decimal(data.get('amount'))
    usdt_network = data.get('usdt_network')
    wallet_address = data.get('wallet_address')
    withdraw_type = data.get('type')


    wallet = Wallet.objects.get(user=user)
    if amount > wallet.balance:
        return JsonResponse({'message': 'Insufficient balance'}, status=402)
    if amount < 50:
        return JsonResponse({'message': 'Minimum withdrawal is $50'}, status=402)
    
    pending_withdrawal = Transaction.objects.filter(user=user, transaction_type='WITHDRAWAL', status="Pending")
    if pending_withdrawal.exists():
        return JsonResponse({'message': 'You still have a pending withdrawal'}, status=402)

    wallet.balance -= amount
    wallet.save()

    if withdraw_type == 'bank':
        Transaction.objects.create(user=user, amount=amount, transaction_type="WITHDRAWAL", information=f"Bank name: {bank_name}\nrecipient_name: {recipient_name}\naccount_number: {account_number}\nphone_number: {phone_number}\nemail_address: {email_address}")
    else:
        Transaction.objects.create(user=user, amount=amount, transaction_type="WITHDRAWAL", information=f"Wallet address: {wallet_address}\nblockchain network: {usdt_network}")

    UserNotification.objects.create(user=user, notification_type='WITHDRAWAL', message=f"Your withdrawal of ${amount} is  on it's way")

    email_msg = EmailMultiAlternatives('New Withdrawal request', f'You have a new pending withdrawal from {user}, ${amount}', no_reply_email, [admin_email])
    email_msg.content_subtype = 'html'
    email_msg.attach_alternative('email_html_template', "text/html")
    SendThreadEmail(email_msg).start()
    
    url = reverse('withdrawal_history')
    return JsonResponse({'url': url}, status=200)


@login_required
def withdrawal_history(request):
    user = request.user
    withdrawals = Transaction.objects.filter(user=user, transaction_type='WITHDRAWAL')
    return render(request, 'account/withdrawal_history.html', {
        'withdrawals': withdrawals
    })


@login_required
def filter_withdrawal_by_date(request):
    user = request.user
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    withdrawals = []

    qs = Transaction.objects.filter(user=user, transaction_type='WITHDRAWAL', date__range=(start_date, end_date))
    for i in qs:
        withdrawal = {'amount': intcomma(i.amount), 'status': i.status, 'date': i.date.strftime("%b. %d, %Y, %I:%M %p").replace("PM", "p.m.").replace("am", "a.m."), 'transaction_id': i.transaction_id}
        withdrawals.append(withdrawal)
    return JsonResponse({'withdrawals': withdrawals}, status=200)

@login_required
def filter_withdrawal_by_status(request):
    user = request.user
    status = request.GET.get('status')
    qs = Transaction.objects.filter(user=user, transaction_type='WITHDRAWAL', status=status)

    withdrawals= []

    for i in qs:
        withdrawal = {'amount': intcomma(i.amount), 'status': i.status, 'date': i.date.strftime("%b. %d, %Y, %I:%M %p").replace("PM", "p.m.").replace("am", "a.m."), 'transaction_id': i.transaction_id}
        withdrawals.append(withdrawal)

    return JsonResponse({'withdrawals': withdrawals}, status=200)


@login_required
def profile(request):
    user = request.user
    unread_notifications = UserNotification.objects.filter(user=user, read=False).count()
    return render(request, 'account/profile.html', {
        "unread_notifications": unread_notifications 
    })


@login_required
def vip(request):
    return render(request, 'account/vip.html',)

@login_required
def upgrade_tier(request, level):
    if level == 'vip-1':
        upgrade_package = 60
        daily_reward = 2.5
        safe = 0.2
        recharge_rate = 0.8
        unlock_amount = 20
        previous_tier = 0
        previous_level = 'VIP 0'
        current_level = 'VIP 1'
    elif level == 'vip-2':
        upgrade_package = 180
        daily_reward = 13
        safe = 0.25
        recharge_rate = 0.8
        unlock_amount = 100
        previous_tier = 1
        previous_level = 'VIP 1'
        current_level = 'VIP 2'
    elif level == 'vip-3':
        upgrade_package = 690
        daily_reward = 38
        safe = 0.25
        recharge_rate = 0.6
        unlock_amount = 300
        previous_tier = 2
        previous_level = 'VIP 2'
        current_level = 'VIP 3'
    elif level == 'vip-4':
        upgrade_package = 1690
        daily_reward = 108
        safe = 0.25
        recharge_rate = 0.65
        unlock_amount = 800
        previous_tier = 3
        previous_level = 'VIP 3'
        current_level = 'VIP 4'
    elif level == 'vip-5':
        upgrade_package = 6900
        daily_reward = 268
        safe = 0.3
        recharge_rate = 0.65
        unlock_amount = 2000
        previous_tier = 4
        previous_level = 'VIP 4'
        current_level = 'VIP 5'
    elif level == 'vip-6':
        upgrade_package = 16900
        daily_reward = 700
        safe = 0.3
        recharge_rate = 0.65
        unlock_amount = 5000
        previous_tier = 5
        previous_level = 'VIP 5'
        current_level = 'VIP 6'
    elif level == 'vip-7':
        upgrade_package = 69000
        daily_reward = 1500
        safe = 0.325
        recharge_rate = 0.7
        unlock_amount = 10000
        previous_tier = 6
        previous_level = 'VIP 6'
        current_level = 'VIP 7'
    elif level == 'vip-8':
        upgrade_package = 169000
        daily_reward = 3000
        safe = 0.35
        recharge_rate = 0.7
        unlock_amount = 20000
        previous_tier = 7
        previous_level = 'VIP 7'
        current_level = 'VIP 8'
    elif level == 'vip-9':
        upgrade_package = 690000
        daily_reward = 8000
        safe = 0.35
        recharge_rate = 0.7
        unlock_amount = 50000
        previous_tier = 8
        previous_level = 'VIP 8'
        current_level = 'VIP 9'
    elif level == 'vip-10':
        upgrade_package = 1690000
        daily_reward = 14000
        safe = 0.4
        recharge_rate = 0.8
        unlock_amount = 80000
        previous_tier = 9
        previous_level = 'VIP 9'
        current_level = 'VIP 10'

    return render(request, 'account/upgrade_tier.html', {
        'slug': level,
        'upgrade_package': upgrade_package,
        'daily_reward': daily_reward,
        'safe': safe,
        'recharge_rate': recharge_rate,
        'unlock_amount': unlock_amount,
        'previous_tier': previous_tier,
        'level': current_level,
    })

@login_required
def upgrade_level(request):
    user = request.user
    data = json.loads(request.body)
    level = data.get('level')
    slug = data.get('slug')
    upgrade_amount = Decimal(data.get('upgrade_amount'))
    wallet = Wallet.objects.get(user=user)
    wallet.level = level
    wallet.balance -= upgrade_amount
    wallet.save()
    UserNotification.objects.create(user=user, notification_type='TIER UPGRADE', message=f"Congratulations, you've successfully upgraded to {level}")


    url = reverse('home')
    return JsonResponse({'url': url}, status=200)

@login_required
def announcements(request):
    user = request.user
    notifications = []
    data = BroadcastNotification.objects.all()
    for i in data:
        notifications.append({'id': i.id, 'subject': i.subject, 'message': i.message, 'broadcast_on': i.broadcast_on, 'read': True if user in i.read_by.all() else False})
    return render(request, 'account/announcement.html', {
        'notifications': notifications
    })


@login_required
def get_broadcast_message(request):
    id =  int(request.GET.get('id'))
    notification = BroadcastNotification.objects.get(id=id)
    message = notification.message
    subject = notification.subject
    user = request.user
    if user in notification.read_by.all():
        read = True
    else:
        read = False
    return JsonResponse({'message': message, 'subject': subject, 'read': read, 'id': id})


@login_required
def mark_as_read(request):
    user = request.user
    data = json.loads(request.body) 
    id = data.get('id')

    notification = BroadcastNotification.objects.get(id=id)
    notification.read_by.add(user)
    notification.save()


    notifications = []
    data = BroadcastNotification.objects.all()
    for i in data:
        notifications.append({'id': i.id, 'subject': i.subject, 'message': i.message, 'broadcast_on': i.broadcast_on.strftime('%b. %d, %Y, %I:%M %p.').lower().capitalize(), 'read': True if user in i.read_by.all() else False})

    return JsonResponse(notifications, safe=False)


@login_required
def notifications(request):
    user = request.user
    notifications = UserNotification.objects.filter(user=user)

    unread_notifications = []
    qs = notifications.filter(read=False)
    for i in qs:
        unread_notifications.append(i.id)
    return render(request, 'account/notifications.html', {
        'notifications': notifications,
        'unread_notifications': unread_notifications
    })

@login_required
def delete_notification(request):
    data = json.loads(request.body)
    id = int(data.get('id'))

    user = request.user
    notification = UserNotification.objects.get(id=id)
    notification.delete()

    notifications = []
    qs = UserNotification.objects.filter(user=user)
    for i in qs:
        notifications.append({'id': i.id, 'notification_type': i.notification_type, 'message': i.message, 'notified_on': i.notified_on.strftime('%b. %d, %Y, %I:%M %p.').lower().capitalize()})
    return JsonResponse(notifications, status=200, safe=False)

@login_required
def read_notifications(request):
    data = json.loads(request.body)
    notifications_ids = data.get('unreadMessagesIds')
    
    for id in notifications_ids:
        notification = UserNotification.objects.get(id=id)
        notification.read = True
        notification.save()

    return JsonResponse({'ids': notifications_ids}, status=200)


@login_required
def redeem_gift(request):
    user = User.objects.get(username="admin@luckyquest.com")
    social_link = WebsiteSocialLink.objects.get(host=user)
    telegram_channel = social_link.telegram_channel


    redemptions = Transaction.objects.filter(user=request.user, transaction_type="GIFT REDEMPTION")
    return render(request, 'account/redeem_gift.html', {
        'telegram_channel': telegram_channel,
        'redemptions': redemptions
    })


@login_required
def redeem_gift_codde(request):
    data = json.loads(request.body)
    user = request.user
    code = data.get('code')

    try:
        redemption = RedemptionCode.objects.get(gift_code=code)
    except RedemptionCode.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Invalid gift code'}, status=404)

    if redemption.redeemed_users.filter(id=user.id).exists():
        return JsonResponse({'status': 'error', 'message': 'Gift code already redeemed by you'}, status=410)

    if redemption.redemptions_remaining < 1:
        return JsonResponse({'status': 'error', 'message': 'Gift code has expired'}, status=410)
    


    wallet = Wallet.objects.get(user=user)
    wallet.balance += redemption.bonus
    redemption.redemptions_remaining -= 1
    redemption.redeemed_users.add(user)
    wallet.save()
    redemption.save()

    UserNotification.objects.create(user=user, notification_type="GIFT REDEMPTION", message=" Congrats! You’ve won $5 from your redemption code")
    Transaction.objects.create(user=user, amount=redemption.bonus, value=f"${redemption.bonus}", transaction_type="GIFT REDEMPTION", transaction_id=redemption.gift_code, status="Successful", approved=True, approved_already_clicked=True)





    return JsonResponse({'bonus': int(redemption.bonus)}, status=200)


@login_required
def team_report(request):
    user = request.user
    today = datetime.now()
    current_date = today.strftime("%Y-%m-%d")
    referrals = Referral.objects.filter(referred_by=user)

    try:
        total_earnings = referrals.first().get_overall_earnings(user=user)
    except:
        total_earnings = 0.00

    return render(request, 'account/team_report.html', {
        'current_date': current_date,
        'referrals': referrals,
        'total_earnings':total_earnings
    })

@login_required
def get_uid(request):
    user = request.user
    query = request.GET.get('query')
    referrals = Referral.objects.filter(referred_by=user)

    wallets_ids = []
    for i in referrals:
        wallet = Wallet.objects.get(user=i.user)
        wallets_ids.append(wallet.id)

    wallets = Wallet.objects.filter(id__in=wallets_ids)
    try:
        user_wallet = wallets.get(uid=query)
        referral = Referral.objects.get(user=user_wallet.user)
        return JsonResponse({'uid': user_wallet.uid, 'slug': user_wallet.slug, 'level': user_wallet.level, 'bonus': intcomma(referral.get_total_upline_bonuses), 'date_joined': user_wallet.user.date_joined.strftime('%b %d %Y')})
    except Wallet.DoesNotExist:
        return JsonResponse({'quert': query}, status=404)

@login_required
def get_uid_info(request):
    uid = request.GET.get('uid')
    wallet = Wallet.objects.get(uid=uid)
    user = wallet.user

    referral = Referral.objects.get(user=user)
    
    total_referrals = referral.total_referrals
    current_level = wallet.level
    slug = wallet.slug
    date_joined = user.date_joined
    vip_deposits = referral.get_total_user_vip_deposits
    referral_bonus = ReferralBonus.objects.filter(referral=referral)

    try:
        total_bonus = referral_bonus.first().get_total_upline_bonuses()
    except AttributeError:
        total_bonus = 0


    bonus_history = []
    for i in referral_bonus:
        bonus_history.append({'bonus_type': i.bonus_type, 'referral_bonus': i.referral_bonus, 'date': i.date.strftime('%d-%b-%Y')})


    return JsonResponse({'uid': uid, 'total_referrals': total_referrals, 'slug': slug, 'current_level': current_level, 'date_joined': date_joined.strftime('%d-%m-%Y'), 'vip_deposits': vip_deposits, 'total_bonus': total_bonus, 'bonus_history': bonus_history}, status=200)


@login_required
def filter_by_level(request):
    level = request.GET.get('level')
    user = request.user
    referrals = Referral.objects.filter(referred_by=user)

    wallets_ids = []
    for i in referrals:
        wallet = Wallet.objects.get(user=i.user)
        wallets_ids.append(wallet.id)

    wallets = Wallet.objects.filter(id__in=wallets_ids)
    filtered_wallet_users= []

    if level != 'All':
        filtered_wallet = wallets.filter(level=level)
        
        for i in filtered_wallet:
            filtered_wallet_users.append(i.user)

        filtered_referrals = []
        referrals = Referral.objects.filter(user__in=filtered_wallet_users)
        for i in referrals:
            referred_user = {'uid': i.user.wallet.uid, 'slug': i.user.wallet.slug, 'level': i.user.wallet.level, 'total_bonus': intcomma(i.get_total_upline_bonuses), 'date_joined': i.user.date_joined.strftime('%b %d %Y')}
            filtered_referrals.append(referred_user) 


    else:
        referrals = Referral.objects.filter(referred_by=user)
        for i in referrals: 
            referred_user = {'uid': i.user.wallet.uid, 'slug': i.user.wallet.slug, 'level': i.user.wallet.level, 'total_bonus': intcomma(i.get_total_upline_bonuses()), 'date_joined': i.user.date_joined.strftime('%b %d %Y')}
            filtered_referrals.append(referred_user) 
    
    
    return JsonResponse({'filtered_referrals': filtered_referrals}, status=200)


@login_required
def filter_by_date(request):
    date = request.GET.get('date')
    user = request.user

    referrals = Referral.objects.filter(referred_by=user)

    filtered_referrals = []
    filtered = referrals.filter(date=date)

    for i in filtered:
        referral = {'uid': i.user.wallet.uid, 'slug': i.user.wallet.slug, 'level': i.user.wallet.level, 'total_bonus': intcomma(i.get_total_upline_bonuses), 'date_joined': i.user.date_joined.strftime('%b %d %Y')}
        filtered_referrals.append(referral)    
    
    return JsonResponse({'filtered_referrals': filtered_referrals}, status=200)


@login_required
def profile_settings(request):
    return render(request, 'account/profile_settings.html')

@login_required
def change_username(request):
    data = json.loads(request.body)
    username = data.get('username')
    user_type = data.get('type')
    # user = User.objects.get(username=username)
    if User.objects.filter(username=username).exists():
        return JsonResponse({'message': 'user with this email already exists'}, status=409) 

    if user_type == 'email':

        user = request.user
        user.username = username
        user.email= username
        user.save()

    else:
        if not is_valid_phone_number(username):
            return JsonResponse({'message': 'Invalid phone number'}, status=400) 
        user = request.user
        user.username = username
        user.phone_number = username
        user.save()

    return JsonResponse({'username': user.username})

@login_required
def change_login_password(request):
    return render(request, 'account/change_login_password.html')

@login_required
def change_password(request):
    user = request.user
    data = json.loads(request.body)
    original_password = data.get('original_password')
    new_password = data.get('new_password')


    is_correct_password = user.check_password(original_password)

    if is_correct_password:
        user.set_password(new_password)
        user.save()
        login(request, user)
    
    else:
        return JsonResponse({'message': 'Incorrect password'}, status=401)

    return JsonResponse({'message': 'success'}, status=200)


def reset_password(request):
    return render(request, 'account/reset_password.html')


def reset_login_password(request):
    data = json.loads(request.body)
    user_id = data.get('user_id')
    verification_code = data.get('verification_code')
    login_type =  data.get('login_type')
    password = data.get('password')

    try:
        user = User.objects.get(username=user_id)
    except User.DoesNotExist:
        return JsonResponse({'message': 'This user does not exist'}, status=404)

    try:
        verification = OtpVerification.objects.get(verification_code=verification_code)
    except OtpVerification.DoesNotExist:
        return JsonResponse({'message': 'Verifcation code is invalid or has expired'}, status=400)
    

    # verification = OtpVerification.objects.get(user=user)
    # if verification.verification_code != verification_code:
    #     return JsonResponse({'message': 'Verifcation code is invalid or has expired'}, status=400)

    
    redirect_url = reverse(sign_in)
    user.set_password(password)
    user.save()



    
    return JsonResponse({'url': redirect_url}, status=200)


def send_otp(request):
    verification_type = request.GET.get('type')
    user_id = request.GET.get('user_id')
    domain_name = request.get_host()
    contact_link = 'https://' + request.get_host() + reverse('customer_service')
    try:
        user = User.objects.get(username=user_id)
    except User.DoesNotExist:
        return JsonResponse({'message': 'This user does not exist'}, status=404)


    verification, created = OtpVerification.objects.get_or_create(user=user)
    verification_code = str(uuid4())[:6]
    verification.verification_code = verification_code
    verification.save()

    if verification_type == 'email':

        html_template_path = 'account/verify_otp.html'
        context_data = {'verification_code': verification_code, 'contact_link': contact_link, 'domain_name': domain_name, 'logo': website_logo, 'site_name': site_name}
        email_html_template = get_template(html_template_path).render(context_data)
        receiver_email = user.email
        email_msg = EmailMultiAlternatives('Your Verification Code', email_html_template, no_reply_email, [receiver_email])
        email_msg.content_subtype = 'html'
        email_msg.attach_alternative(email_html_template, "text/html")
        email_msg.send()
    else:
        pass
    
    return JsonResponse({}, status=200)

@login_required
def grant_gift(request):
    data = json.loads(request.body)
    amount = Decimal(data.get('amount'))
    user = request.user
    wallet = Wallet.objects.get(user=user)
    wallet.balance += amount
    wallet.save()
    UserNotification.objects.create(user=user, notification_type='DAILY SPIN REWARD', message=f"Congratulations you won ${amount} from the daily login spin")
    Transaction.objects.create(user=user, amount=amount, transaction_type='DAILY SPIN REWARD', information=f'{user.username} won ${amount}  from the daily login spin', status='Successful', approved=True)
    return JsonResponse({'message': 'ok'}, status=200)

@login_required
def feedback(request):
    return render(request, 'account/feedback.html', {})

@login_required
def send_feedback(request):
    message = request.GET.get('feedback')
    send_mail(f"Feedback from {request.user}", message, f'{request.user}', [support_email])
    return JsonResponse({}, status=200)

@login_required
def change_language(request):
    return render(request, 'account/change_language.html')


def customer_service(request):
    return render(request, 'account/customer_service.html', {})

def about(request):
    return render(request, 'account/about.html')

def privacy_agreement(request):
    domain_name = 'https://' + request.get_host()
    return render(request, 'account/privacy_agreement.html', {
        'domain_name': domain_name
    })

def risk_disclosure(request):
    return render(request, 'account/risk_disclosure.html', {
        'support_mail': support_mail
    })


def sign_out(request):
    logout(request)
    return redirect('sign_in')