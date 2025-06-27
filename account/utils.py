import random
import uuid
from datetime import date
from decimal import Decimal
from phonenumber_field.phonenumber import to_python
from phonenumbers import NumberParseException, is_possible_number, is_valid_number
from django.http import HttpResponse



def generate_inv_code(instance):
    klass = instance.__class__
    code = str(uuid.uuid4()).replace('-', '')[:6]
    if klass.objects.filter(invitation_code=code).exists():
        generate_inv_code(instance)
    return code


def generate_uid(instance):
    klass = instance.__class__
    numbers = [random.randint(0, 9) for _ in range(8)]
    uid = ''.join(map(str, numbers))
    if klass.objects.filter(uid=uid).exists():
        generate_uid(instance)
    return uid


def is_valid_phone_number(phone_number):
    try:
        phone_number_obj = to_python(phone_number)
        return phone_number_obj is not None and is_possible_number(phone_number_obj) and is_valid_number(phone_number_obj)
    except NumberParseException:
        return False
    

def handle_referral(klass, bonusKlass, created_user, invitation):
    from notifications_center.models import UserNotification
    from payments.models import Transaction
    from account.models import Wallet
 

    referral = klass.objects.get(user=created_user)
    referral.referred_by = invitation.user
    invitation.total_referrals += 1
    invitation.total_referral_bonus += 10
    wallet = Wallet.objects.get(user=referral.user)
    wallet.balance += 5
    referral.save()
    invitation.save()
    wallet.save()

    bonusKlass.objects.create(referral=referral, referral_bonus=Decimal('10.00'))
    UserNotification.objects.create(user=invitation.user, notification_type="REFERRAL NOTIFICATION", message=f"successfully referred user, uid:{referral.user.wallet.uid}")
    UserNotification.objects.create(user=referral.user, notification_type="REGISTERATION GIFT", message=" You've just received a signup bonus of $5")
    Transaction.objects.create(user=referral.user, amount=Decimal('5.00'), value='5.00', transaction_type='REGISTERATION GIFT', status='Successful', approved=True, approved_already_clicked=True)

    return True
    
def add_daily_login_reward(user):
    today = date.today()
    
    if user.last_login_reward_date != today:
        from notifications_center.models import UserNotification
        from account.models import Wallet
        from payments.models import Transaction
        wallet = Wallet.objects.get(user=user)
        if wallet.level == 'VIP 0':
            amount = Decimal('0') 
        elif wallet.level == 'VIP 1':
            amount = Decimal('2.5')
        elif wallet.level == 'VIP 2':
            amount = Decimal('13')
        elif wallet.level == 'VIP 3':
            amount = Decimal('38')
        elif wallet.level == 'VIP 4':
            amount = Decimal('108')
        elif wallet.level == 'VIP 5':
            amount = Decimal('268')
        elif wallet.level == 'VIP 6':
            amount = Decimal('700')
        elif wallet.level == 'VIP 7':
            amount = Decimal('1500')
        elif wallet.level == 'VIP 8':
            amount = Decimal('3000')
        elif wallet.level == 'VIP 9':
            amount = Decimal('8000')
        elif wallet.level == 'VIP 10':
            amount = Decimal('14000')

        if wallet.level != 'VIP 0':
            print('gifting the user his login bonus')
            wallet.balance += amount
            user.last_login_reward_date = today
            user.save()
            wallet.save()
            UserNotification.objects.create(user=user, notification_type='LOGIN REWARD', message=f"Login reward of ${amount} has been granted")
            Transaction.objects.create(user=user, amount=amount, transaction_type='LOGIN REWARD', information=f'{user.username} logged in on {today} and made a bonus of ${amount}', status='Successful', approved=True)
            return True