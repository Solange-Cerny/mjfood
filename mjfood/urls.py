"""
Definition of urls for mjfood.
"""

from datetime import datetime
from django.urls import path
from django.contrib import admin
from django.contrib.auth.views import LoginView, LogoutView
from app import forms, views

# https://stackoverflow.com/a/51635038
from django.views.static import serve
from django.conf import settings
from django.conf.urls import url

from app.models import LogMessage

home_list_view = views.HomeListView.as_view(
    queryset=LogMessage.objects.order_by("-log_date")[:5],  # :5 limits the results to the five most recent
    context_object_name="message_list",
    template_name="app/index.html",
)


urlpatterns = [
    #path('', views.home, name='home'),
    path('', home_list_view, name='home'),
    path('gallery/', views.gallery, name='gallery'),
    path('contact/', views.contact, name='contact'),
    path('about/', views.about, name='about'),
    path('login/',
         LoginView.as_view
         (
             template_name='app/login.html',
             authentication_form=forms.BootstrapAuthenticationForm,
             extra_context=
             {
                 'title': 'Log in',
                 'year' : datetime.now().year,
             }
         ),
         name='login'),
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),
    path('admin/', admin.site.urls),
    url(r'^app/static/(?P<path>.*)$', serve,{'document_root': settings.STATIC_ROOT}),
    path("log/", views.log_message, name="log"), 
    # This path is included by default when creating the app
    path("admin/", admin.site.urls),
]
