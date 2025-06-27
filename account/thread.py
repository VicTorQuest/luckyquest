import threading



class SendThreadEmail(threading.Thread):
    def __init__(self, email):
        self.email = email

        threading.Thread.__init__(self)

    def run(self):
        print('sending email')
        self.email.send(fail_silently=False)
        print('email sent')

