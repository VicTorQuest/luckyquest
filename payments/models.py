from decimal import Decimal, ROUND_HALF_UP
from django.contrib.humanize.templatetags.humanize import intcomma
from django.db import models
from django.utils import timezone
from .utils import generate_trx_id
from account.models import Referral, User, Wallet
from notifications_center.models import UserNotification




BONUS_TYPE = (
    ('NEW REFERRAL', 'NEW REFERRAL',),
    ('DEPOSIT COMMISSION', 'DEPOSIT COMMISSION')
)



# Create your models here.
class ReferralBonus(models.Model):
    referral = models.ForeignKey(Referral, on_delete=models.CASCADE, related_name='referral_bonus')
    referral_bonus = models.DecimalField(decimal_places=2, max_digits=12, default=0.00)
    bonus_type = models.CharField(max_length=30, choices=BONUS_TYPE, default='NEW REFERRAL',)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Referral Bonuses'
        ordering = ['-date']

    def get_total_upline_bonuses(self):
        bonuses = ReferralBonus.objects.filter(referral=self.referral)
        up_line_bonues = [refs.referral_bonus for refs in bonuses]
        total_bonus = sum(up_line_bonues)
        return total_bonus


TRANSACTION_TYPE = (
    ('DAILY SPIN REWARD', 'DAILY SPIN REWARD'),
    ('DEPOSIT', 'DEPOSIT'),
    ('WITHDRAWAL', 'WITHDRAWAL'),
    ('GIFT REDEMPTION', 'GIFT REDEMPTION'),
    ('REGISTERATION GIFT', 'REGISTERATION GIFT'),
    ('LOGIN REWARD', 'LOGIN REWARD')
)


TRANSACTION_STATUS = (
    ('Successful', 'Successful'),
    ('Pending', 'Pending'),
    ('Failed', 'Failed')
)


class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(decimal_places=2, max_digits=12, default=0.00)
    value = models.CharField(max_length=255, null=True, blank=True, help_text="Crypto value of the converted amount")
    transaction_type = models.CharField(max_length=100, choices=TRANSACTION_TYPE, default="DEPOSIT")
    information = models.TextField(null=True, blank=True)
    transaction_id = models.CharField(max_length=50, blank=True)
    proof_of_payment = models.ImageField(null=True, blank=True, upload_to="payment_proof")
    status = models.CharField(max_length=50, choices=TRANSACTION_STATUS, default="Pending")
    date = models.DateTimeField(default=timezone.now)
    approved = models.BooleanField(default=False)

    approved_already_clicked = models.BooleanField(default=False)


    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.transaction_id


    def save(self, *args, **kwargs):
        if self.transaction_id == '' or self.transaction_id is None:
            self.transaction_id = generate_trx_id(self)

        
        if self.approved == True:
            if self.approved_already_clicked == False and self.transaction_type == 'DEPOSIT':
                wallet = Wallet.objects.get(user=self.user)
                wallet.balance += self.amount
                wallet.save()

                self.approved_already_clicked = True
                self.status = 'Successful'

                amount = intcomma(self.amount)

                UserNotification.objects.create(user=self.user, notification_type='DEPOSIT', message=f"Your recharge deposit of ${amount} was successful")

                if self.user.vip_deposit == False:
                    try:
                        print("starting the coommision")
                        referred_user = Referral.objects.get(user=self.user)
                        print(referred_user)
                        parent_user = referred_user.referred_by
                        print(parent_user)
                        parent_referral = Referral.objects.get(user=parent_user)
                        referred_user_level = self.user.wallet.level

                        print(referred_user_level)
                        if referred_user_level == 'VIP 1':
                            commission = (Decimal(10) / Decimal(100)) * self.amount
                            commission = commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)   
                        elif referred_user_level == 'VIP 2':
                            commission = (Decimal(3) / Decimal(100)) * self.amount
                            commission = commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        elif referred_user_level == 'VIP 3':
                            commission = (Decimal(1) / Decimal(100)) * self.amount
                            commission = commission.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        else:
                            commission = None
                        

                        if commission:

                            parent_referral.total_vip_deposits += 1
                            parent_referral.total_vip_deposit_amount += commission
                            parent_referral.total_referral_bonus += commission
                            parent_referral.vip_depositors.add(self.user)
                            parent_referral.save()

                            print("added the coommision")

                            UserNotification.objects.create(user=parent_user, notification_type="REFERRAL NOTIFICATION", message=f"You made a commission of ${commission} from uid:{self.user.wallet.uid}")
                            ReferralBonus.objects.create(referral=referred_user, referral_bonus=commission, bonus_type='DEPOSIT COMMISSION')
                            print('saving')
                            self.user.vip_deposit = True
                            self.user.save()
                            print('saved')
                    except:
                        pass

                    

                    

            if self.approved_already_clicked == False and self.transaction_type == 'WITHDRAWAL':
                self.approved_already_clicked = True
                self.status = 'Successful'
                UserNotification.objects.create(user=self.user, notification_type='WITHDRAWAL', message=f"Your withdrawal of ${intcomma(self.amount)} was successful")

        
        if self.status == 'Failed' and self.transaction_type == 'WITHDRAWAL':
            wallet = Wallet.objects.get(user=self.user)
            wallet.balance += self.amount
            wallet.save()

            self.approved = False
            self.status = 'Failed'

            UserNotification.objects.create(user=self.user, notification_type='WITHDRAWAL', message=f"Your withdrawal of ${intcomma(self.amount)} was unsuccessful")

        super(Transaction, self).save(*args, **kwargs)


class DepositIssue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)
    transction_reference_number = models.CharField(max_length=200)
    recipient_bank_account = models.CharField(max_length=100)
    message = models.TextField(blank=True, null=True)
    proof_of_payment = models.ImageField(upload_to="payment_proof")