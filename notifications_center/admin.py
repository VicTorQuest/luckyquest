from django.contrib import admin
from notifications_center.models import BroadcastNotification, UserNotification

# Register your models here.
class BroadcastNotificationAdmin(admin.ModelAdmin):
    search_fields = ['subject']
    list_display = ['subject', 'broadcast_on']
    list_filter = ['broadcast_on']


class UserNotificationAdmin(admin.ModelAdmin):
    search_fields = ['user__username']
    list_display = ['user', 'notification_type', 'notified_on',]
    list_filter = ['notified_on', 'user']



admin.site.register(BroadcastNotification, BroadcastNotificationAdmin)
admin.site.register(UserNotification, UserNotificationAdmin)