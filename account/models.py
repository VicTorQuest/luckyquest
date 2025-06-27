from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
# from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField
from .utils import generate_inv_code, generate_uid
from django.utils.text import slugify

# Create your models here.


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email=None, phone_number=None, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email) if email else None
        user = self.model(username=username, email=email, phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, phone_number=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, phone_number, password, **extra_fields)
    


class User(AbstractUser):
    email = models.EmailField(null=True, blank=True, unique=True)
    phone_number = PhoneNumberField(null=True, blank=True, unique=True)
    last_login_reward_date = models.DateField(null=True, blank=True)
    vip_deposit = models.BooleanField(default=False, help_text="States whether this user has made his or her vip deposit")

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()


    def save(self, *args, **kwargs):
        if self.email == '':
            self.email = None
        super(User, self).save(*args, **kwargs)



LEVEL = (
    ('VIP 0', 'VIP 0'), 
    ('VIP 1', 'VIP 1'), 
    ('VIP 2', 'VIP 2'),
    ('VIP 3', 'VIP 3'),
    ('VIP 4', 'VIP 4'),
    ('VIP 5', 'VIP 5'),
    ('VIP 6', 'VIP 6'),
    ('VIP 7', 'VIP 7'),
    ('VIP 8', 'VIP 8'),
    ('VIP 9', 'VIP 9'),
    ('VIP 10', 'VIP 10'),

)


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=12, default=0.00, decimal_places=2)
    level = models.CharField(max_length=10, choices=LEVEL, default='VIP 0',)
    tier = models.IntegerField(null=True, blank=True)
    uid = models.CharField(max_length=8, null=True, blank=True, unique=True)

    slug = models.CharField(max_length=10, blank=True, null=True)


    def __str__(self):
        return f"{self.user.username} - {self.balance}"
    
    def save(self, *args, **kwargs):
        if self.uid == "" or self.uid is None:
            self.uid = generate_uid(self)
        self.slug = slugify(self.level.lower())

        if self.level == 'VIP 0':
            self.tier = 0
        elif self.level == 'VIP 1':
            self.tier = 1
        elif self.level == 'VIP 2':
            self.tier = 2
        elif self.level == 'VIP 3':
            self.tier = 3
        elif self.level == 'VIP 4':
            self.tier = 4
        elif self.level == 'VIP 5':
            self.tier = 5
        elif self.level == 'VIP 6':
            self.tier = 6
        elif self.level == 'VIP 7':
            self.tier = 7
        elif self.level == 'VIP 8':
            self.tier = 8
        elif self.level == 'VIP 9':
            self.tier = 9
        elif self.level == 'VIP 10':
            self.tier = 10



        super(Wallet, self).save(*args, **kwargs)



class Referral(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    invitation_code = models.CharField(max_length=6, blank=True)
    total_referrals = models.IntegerField(default=0)
    referred_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='ref_by')
    total_referral_bonus = models.DecimalField(decimal_places=2, max_digits=12, default=0.00)
    total_vip_deposit_amount = models.DecimalField(decimal_places=2, max_digits=12, default=0.00, help_text="The total vip deposit of the referrals for this user")
    total_vip_deposits = models.IntegerField(default=0, help_text="the total number of vip deposits of the referrals for this user")
    vip_depositors = models.ManyToManyField(User, blank=True, related_name="vip_depositors", help_text="States the referred users that has made vip deposits")
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return '{}-{}'.format(self.user.username, self.invitation_code)

    @property
    def get_referred_users(self):
        qs = Referral.objects.all()
        my_refs = [refs for refs in qs if refs.referred_by == self.user]
        return my_refs
    
    @property
    def get_total_user_vip_deposits(self):
        from payments.models import ReferralBonus
        bonuses = ReferralBonus.objects.filter(referral=self, bonus_type="DEPOSIT COMMISSION")
        up_line_bonues = [refs.referral_bonus for refs in bonuses]
        total_bonus = sum(up_line_bonues)
        return total_bonus
    
    @property
    def get_total_upline_bonuses(self):
        from payments.models import ReferralBonus
        bonuses = ReferralBonus.objects.filter(referral=self)
        up_line_bonues = [refs.referral_bonus for refs in bonuses]
        total_bonus = sum(up_line_bonues)
        return total_bonus


    
    def get_overall_earnings(self, user):
        referrals = Referral.objects.filter(referred_by=user)
        earnings = [refs.get_total_upline_bonuses for refs in referrals]
        total_earnings = sum(earnings)
        return total_earnings
    
        


    def save(self, *args, **kwargs):
        if self.invitation_code == "" or self.invitation_code is None:
            code = generate_inv_code(self)
            self.invitation_code = code
            print(self.user, 'is referred by', self.referred_by, 'during account creation')
        else:
            print(self.user, 'is referred by', self.referred_by, 'when updating account')
        super(Referral, self).save(*args, **kwargs)


class OtpVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    verification_code = models.CharField(max_length=6, blank=True, null=True)


    class Meta:
        verbose_name_plural = "OTP Verifications"