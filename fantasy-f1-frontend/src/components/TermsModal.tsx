import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const content = type === 'terms' ? {
    title: 'Terms & Conditions',
    text: `Effective Date: 09-06-2025

Welcome to TheFantasyF1Game. By using our app, you agree to the following terms:

1. Eligibility
You must be 13 years or older to register and use the app. By creating an account, you confirm that you meet this requirement.

2. User Responsibilities
You are responsible for the accuracy of your team and driver selections.
Abusive, offensive, or cheating behavior is strictly prohibited.

3. Intellectual Property
All logos, images, and game mechanics are owned by us or are properly licensed. You may not copy, distribute, or modify them without permission.

4. Account Termination
We reserve the right to suspend or delete accounts that violate these terms.

5. No Affiliation with Formula 1
TheFantasyF1Game is an independent fan-made app and is not affiliated with Formula 1, the FIA, or any of its associated entities.

6. Limitation of Liability
We are not liable for any damages or losses resulting from the use of our app, including but not limited to technical issues or user disputes.

7. Changes to These Terms
We may revise these Terms & Conditions at any time. Continued use of the app after updates means you accept the new terms.`
  } : {
    title: 'Privacy Policy',
    text: `Effective Date: 09-06-2025

At TheFantasyF1Game, we respect your privacy. This policy explains how we collect, use, and protect your data when you use our website and services.

1. Information We Collect
Name and email address (when you sign up)
Selections and interactions within the app

2. How We Use Your Information
To provide and improve our services
To communicate important updates
To ensure fair play and prevent abuse

3. Data Sharing
We do not sell or share your personal data with third parties except:
If required by law
With trusted service providers for hosting and analytics purposes

4. Your Rights
You have the right to access, update, or delete your data. To do so, contact us at thefantasyf1game@gmail.com

5. Security
We use industry-standard measures to protect your personal data.

6. Changes to This Policy
We may update this Privacy Policy from time to time. We'll notify you of significant changes by email or in-app notifications.`
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {content.title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2">
              <div className="text-sm text-gray-500 whitespace-pre-line">
                {content.text}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal; 