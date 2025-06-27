from django.db import models
from account.models import User

# Create your models here.
class WebsiteSocialLink(models.Model):
    host = models.OneToOneField(User, on_delete=models.CASCADE)
    telegram_customer_service = models.CharField(max_length=200)
    telegram_channel = models.CharField(max_length=200)


class RedemptionCode(models.Model):
    gift_code = models.CharField(max_length=12)
    bonus = models.DecimalField(decimal_places=2, max_digits=12, help_text="amount to be gifted to users if they use this code")
    redeemed_users = models.ManyToManyField(User, blank=True)
    redemptions_remaining = models.IntegerField(default=100)


class AllAdminWallets(models.Model):
    admin_account = models.OneToOneField(User, on_delete=models.CASCADE)
    ERC_Wallet_Address = models.CharField(max_length=255, blank=False, null=True)
    ERC_QRCODE_IMAGE_LINK = models.CharField(max_length=255, blank=False, null=True)
    TRC_Wallet_Address = models.CharField(max_length=255, blank=False, null=True)
    TRC_QRCODE_IMAGE_LINK = models.CharField(max_length=255, blank=False, null=True)

    class Meta:
        verbose_name_plural = "All admin wallets"

    def __str__(self):
        return "{} wallet".format(self.admin_account)


class CurrentSiteWallet(models.Model):
    wallet = models.OneToOneField(AllAdminWallets, on_delete=models.CASCADE)

    class Meta:
        verbose_name_plural = "Current site wallet"

    def __str__(self):
        return 'Current site wallet: {}'.format(self.wallet)