from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from account.models import User, Referral, Wallet, OtpVerification
from django.dispatch import receiver
from .utils import add_daily_login_reward


@receiver(post_save, sender=User)
def create_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(user=instance)



@receiver(post_save, sender=User)
def create_or_update_referral(sender, instance, created, **kwargs):
    if created:
        Referral.objects.create(user=instance)


@receiver(post_save, sender=User)
def create_otpverification(sender, instance, created, **kwargs):
    if created:
        OtpVerification.objects.create(user=instance)



# @receiver(post_save, sender=User)
# def create_referral(sender, instance, created, **kwargs):
#     if created:
#         Referral.objects.create(user=instance)

# @receiver(post_save, sender=User)
# def save_referral(sender, instance, **kwargs):
#     instance.referral.save()
    