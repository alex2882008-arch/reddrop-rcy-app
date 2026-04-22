import React from 'react';
import { PublicLayout } from '../components/Layout';

export default function LegalPolicies() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-[#b91c1c] text-white px-6 py-5">
            <h1 className="text-2xl font-black">RedDrop RCY Legal Policies</h1>
            <p className="text-red-100 text-sm mt-1">Terms and Conditions and Privacy Policy</p>
          </div>

          <div className="p-6 sm:p-8 space-y-8 text-sm text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Terms and Conditions</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold">Platform Purpose:</span> RedDrop RCY is a humanitarian coordination platform for blood donation and emergency support under Red Crescent volunteer values in Bangladesh.</li>
                <li><span className="font-semibold">User Eligibility:</span> Users must be at least 18 years old or otherwise legally eligible to register as volunteers, donors, coordinators, or recipients.</li>
                <li><span className="font-semibold">Accurate Information:</span> Users must provide true and updated blood group, contact details, and profile data. False or misleading data may result in suspension.</li>
                <li><span className="font-semibold">No Medical Service:</span> RedDrop RCY coordinates communication between volunteers and requesters. It does not provide diagnosis, treatment, transfusion services, or clinical guarantees.</li>
                <li><span className="font-semibold">Liability Disclaimer:</span> RedDrop RCY and its volunteers are not liable for medical outcomes, treatment decisions, delays, or complications resulting from donor-recipient interactions.</li>
                <li><span className="font-semibold">No Commercial Blood Activity:</span> Buying, selling, brokering, or any commercial use of blood is strictly prohibited. Violations may lead to account termination and legal reporting.</li>
                <li><span className="font-semibold">Responsible Use:</span> Users must avoid abusive behavior, harassment, fraud, misinformation, unauthorized account access, or misuse of emergency channels.</li>
                <li><span className="font-semibold">Volunteer Conduct:</span> All users are expected to respect dignity, neutrality, and volunteerism in line with Red Crescent humanitarian principles.</li>
                <li><span className="font-semibold">Termination Policy:</span> RedDrop RCY may suspend or permanently disable accounts for policy violations, suspicious activity, repeated abuse, or legal non-compliance.</li>
                <li><span className="font-semibold">Governing Law:</span> These terms are governed by and interpreted under the laws of Bangladesh.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Privacy Policy</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold">Data We Collect:</span> Basic profile information such as name, blood group, phone numbers, location, role, and emergency request details.</li>
                <li><span className="font-semibold">Why We Collect Data:</span> To match donors with emergency requests, coordinate response, ensure platform safety, and maintain operational transparency.</li>
                <li><span className="font-semibold">Phone Number Privacy:</span> Phone numbers are visible only to relevant verified users involved in donor-recipient coordination and authorized coordinators.</li>
                <li><span className="font-semibold">Blood Group Data:</span> Blood group information is used strictly for matching and emergency response. It is not sold or shared for unrelated commercial use.</li>
                <li><span className="font-semibold">Data Security:</span> We apply technical and access-control safeguards to reduce unauthorized data access, modification, or disclosure.</li>
                <li><span className="font-semibold">Behavior and Safety Monitoring:</span> Security-related user actions may be logged to prevent abuse and protect volunteers and recipients.</li>
                <li><span className="font-semibold">Third-Party Services:</span> Infrastructure providers may process data on our behalf for authentication, notifications, and secure platform operation.</li>
                <li><span className="font-semibold">Retention and Deletion:</span> Data may be retained as needed for safety, legal compliance, and service continuity, then removed according to policy.</li>
                <li><span className="font-semibold">Your Responsibility:</span> Keep your profile and emergency details accurate, and do not share personal contact data outside legitimate coordination needs.</li>
                <li><span className="font-semibold">Policy Updates:</span> These policies may be updated to improve safety, legal compliance, and service quality. Continued use means acceptance of updates.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
