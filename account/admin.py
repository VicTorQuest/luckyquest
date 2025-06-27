from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Referral, Wallet, OtpVerification
# Register your models here.


class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone_number', 'is_staff',)
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'phone_number')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'first_name', 'last_name')}),
        ('More info', {'fields': ('phone_number',)}),  # Add your custom field here
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'last_login_reward_date', 'vip_deposit')}),
    )



class WalletAdmin(admin.ModelAdmin):
    search_fields = ['user__username', 'uid']
    prepopulated_fields = {'slug': ['level']}
    list_display = ['user', 'uid', 'level', 'balance']
    list_filter = ['level']



class ReferralAdmin(admin.ModelAdmin):
    search_fields = ['user__username', 'referred_by__username']
    list_display = ['user', 'total_referrals', 'invitation_code', 'referred_by', 'date']
    list_filter = ['referred_by', 'date']


class OtpVerificationAdmin(admin.ModelAdmin):
    search_fields = ['user__username', 'verification_code']
    list_display = ['user', 'verification_code']



admin.site.register(User,CustomUserAdmin)
admin.site.register(Referral, ReferralAdmin)
admin.site.register(Wallet, WalletAdmin)
admin.site.register(OtpVerification, OtpVerificationAdmin)

