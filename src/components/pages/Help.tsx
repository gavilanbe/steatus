import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { HelpCircle, Heart, Users, Shield, Smartphone, ChevronDown, ChevronRight } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

export function Help() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs: FAQ[] = [
    {
      question: "What is sTEAtus?",
      answer: "sTEAtus is a mood-sharing app designed specifically for TEA (autism) users and their support networks. It allows you to easily communicate your emotional state with trusted friends and family members."
    },
    {
      question: "How do I add someone to my support network?",
      answer: "Go to the Friends tab, then tap 'Add'. You can search by name/email, send invitations, or share your friend code for quick adding."
    },
    {
      question: "What does 'ack' mean?",
      answer: "'Ack' is short for acknowledgment. When someone in your support network sees your mood update, they can 'ack' it to let you know they've seen it and are thinking of you."
    },
    {
      question: "Can I control who sees my mood?",
      answer: "Yes! You can toggle your status visibility on/off anytime. You can also manage privacy settings to control which friends see your mood and history."
    },
    {
      question: "How do notifications work?",
      answer: "You'll get gentle notifications when friends update their mood or acknowledge yours. You can customize notification settings including quiet hours in the Settings."
    },
    {
      question: "Is my data private?",
      answer: "Absolutely. Your mood data is only shared with people you explicitly add to your support network. We never share your information with third parties."
    },
    {
      question: "Can I see my mood patterns over time?",
      answer: "Yes! The History tab shows your mood timeline and statistics to help you and your support team understand patterns and triggers."
    },
    {
      question: "What if I'm in crisis?",
      answer: "sTEAtus is a support tool, not a crisis intervention service. If you're in immediate danger, please contact emergency services (911) or a crisis hotline immediately."
    }
  ]

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="space-y-4 pb-6">
      {/* About sTEAtus */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            About sTEAtus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-amber-700">
            sTEAtus was created with love for the TEA (autism) community. We understand that communicating emotions can sometimes be challenging, and having a simple way to share how you're feeling with your support network can make a real difference.
          </p>
          <p className="text-amber-700">
            Our goal is to bridge the communication gap between TEA individuals and their loved ones, therapists, and support networks through simple, visual mood sharing.
          </p>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800">Key Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-red-500 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900">Easy Mood Sharing</h4>
              <p className="text-sm text-amber-700">Six simple moods with emojis for quick emotional communication</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900">Support Network</h4>
              <p className="text-sm text-amber-700">Connect with family, friends, therapists, and caregivers</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-500 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900">Privacy Controls</h4>
              <p className="text-sm text-amber-700">You control who sees your moods and when</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900">Accessible Design</h4>
              <p className="text-sm text-amber-700">Created with neurodiversity and accessibility in mind</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-amber-200 rounded-lg">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-amber-50 rounded-lg transition-colors"
              >
                <span className="font-medium text-amber-900">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronDown className="w-4 h-4 text-amber-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-amber-600" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-3 pb-3">
                  <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded border-t">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Crisis Resources */}
      <Card className="doodle-card border-red-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-red-800">Crisis Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium mb-2">If you're in immediate danger:</p>
            <p className="text-sm text-red-700">Call 911 or go to your nearest emergency room</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-amber-900">Crisis Hotlines:</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <p>• National Suicide Prevention Lifeline: 988</p>
              <p>• Crisis Text Line: Text HOME to 741741</p>
              <p>• Autism Crisis Support: Contact your local autism organization</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="doodle-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-800">Need More Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-amber-700 text-sm">
            If you have questions or need support using sTEAtus, we're here to help.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Email Support
            </Button>
            <Button variant="outline" className="flex-1">
              User Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Version */}
      <div className="text-center py-4">
        <p className="text-xs text-amber-600">
          sTEAtus v1.0.0 • Made with 💝 for the TEA community
        </p>
      </div>
    </div>
  )
}