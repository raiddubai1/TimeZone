"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useContactSubmissionMutation, validateContactForm, type ContactFormData } from "@/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Extend the ContactFormData with Zod validation
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type ContactFormSchema = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormSchema>({
    resolver: zodResolver(contactFormSchema),
  });

  const mutation = useContactSubmissionMutation();

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      description: "support@timezone.app",
      action: "mailto:support@timezone.app"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "+1 (555) 123-4567",
      action: "tel:+15551234567"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "San Francisco, CA",
      action: "#"
    },
    {
      icon: Clock,
      title: "Business Hours",
      description: "24/7 Support",
      action: "#"
    }
  ];

  const onSubmit = async (data: ContactFormSchema) => {
    try {
      setSubmitError(null);
      await mutation.mutateAsync(data);
      setIsSubmitted(true);
      reset();
    } catch (error) {
      setSubmitError("Failed to submit the form. Please try again.");
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmitError(null);
    reset();
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h1 className="text-3xl font-bold text-gray-900">Message Sent Successfully!</h1>
              <p className="text-lg text-gray-600">
                Thank you for contacting us. We've received your message and will get back to you as soon as possible.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>We typically respond within 24-48 hours during business days.</p>
                <p>If you don't hear from us, please check your spam folder.</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={resetForm} variant="outline">
                  Send Another Message
                </Button>
                <Button onClick={() => window.location.href = "/"}>
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{submitError}</span>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">First Name *</label>
                      <Input 
                        placeholder="John" 
                        className="hover:border-foreground transition-colors duration-300"
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Last Name *</label>
                      <Input 
                        placeholder="Doe" 
                        className="hover:border-foreground transition-colors duration-300"
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email *</label>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      className="hover:border-foreground transition-colors duration-300"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject *</label>
                    <Input 
                      placeholder="How can we help?" 
                      className="hover:border-foreground transition-colors duration-300"
                      {...register("subject")}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message *</label>
                    <Textarea 
                      placeholder="Tell us more about your inquiry..." 
                      className="min-h-[120px] hover:border-foreground transition-colors duration-300"
                      {...register("message")}
                    />
                    {errors.message && (
                      <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 10 characters
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full hover:bg-foreground hover:text-background transition-colors duration-300"
                    disabled={isSubmitting || mutation.isPending}
                  >
                    {isSubmitting || mutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => (
                  <Card key={info.title} className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-border bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <info.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{info.title}</h3>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How accurate is TimeZone?</h4>
                  <p className="text-sm text-muted-foreground">
                    TimeZone uses official time zone databases and updates automatically for daylight saving time changes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Is TimeZone free to use?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, we offer a free tier with essential features. Premium features are available for power users.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Do you offer API access?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, we provide API access for developers and businesses. Contact us for details.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
                <CardDescription>
                  Stay updated with our latest features and announcements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Button variant="outline" size="sm" className="hover:bg-foreground hover:text-background transition-colors duration-300">
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-foreground hover:text-background transition-colors duration-300">
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-foreground hover:text-background transition-colors duration-300">
                    GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}