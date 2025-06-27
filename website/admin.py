from django.contrib import admin
from .models import WebsiteSocialLink, RedemptionCode, AllAdminWallets, CurrentSiteWallet

# Register your models here.
class WebsiteSocialLinkAdmin(admin.ModelAdmin):
    search_fields = ['host__username']
    list_display = ['host', 'telegram_channel', 'telegram_customer_service']


class RedemptionCodeAdmin(admin.ModelAdmin):
    search_fields = ['gift_code']
    list_display = ['gift_code', 'bonus', 'redemptions_remaining']


class AllAdminWalletsFormat(admin.ModelAdmin):
    list_display = ['admin_account', 'ERC_Wallet_Address', 'TRC_Wallet_Address']


admin.site.register(WebsiteSocialLink, WebsiteSocialLinkAdmin)
admin.site.register(RedemptionCode, RedemptionCodeAdmin)
admin.site.register(AllAdminWallets, AllAdminWalletsFormat)
admin.site.register(CurrentSiteWallet)