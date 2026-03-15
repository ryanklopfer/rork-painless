import { LearnCard } from '@/types';

export const learnCards: LearnCard[] = [
  {
    id: 'pain-not-damage',
    category: 'pain-science',
    title: 'Pain ≠ Damage',
    summary: 'Pain is a protective signal, not always an indicator of tissue damage.',
    content: 'Pain is a complex experience produced by the brain as a protective mechanism. It involves nociception (detection of potentially harmful stimuli), modulation (how the nervous system amplifies or dampens signals), and sensitization (when the nervous system becomes more reactive over time). Understanding that pain doesn\'t always equal tissue damage is crucial for recovery — it empowers you to gradually re-engage with activity safely.',
    icon: 'brain',
  },
  {
    id: 'graded-exposure-intro',
    category: 'pain-science',
    title: 'Graded Exposure',
    summary: 'Gradually increasing activity to desensitize pain responses.',
    content: 'Graded exposure involves systematically and progressively increasing your activity levels to help desensitize pain responses and rebuild resilience. Instead of avoiding movement due to fear of pain, you slowly introduce activities at tolerable levels and progress over time. This approach helps retrain the nervous system, reduces fear-avoidance behaviors, and builds confidence in your body\'s ability to handle load.',
    icon: 'trending-up',
  },
  {
    id: 'biopsychosocial',
    category: 'pain-science',
    title: 'The Biopsychosocial Model',
    summary: 'Pain is influenced by biological, psychological, and social factors.',
    content: 'Modern pain science emphasizes that pain management requires addressing biological factors (tissue health, load tolerance), psychological factors (beliefs, fear, stress, catastrophizing), and social factors (support systems, work demands, lifestyle). Effective rehabilitation addresses all three domains — not just the physical. Education, reassurance, and developing positive beliefs about recovery are as important as the exercises themselves.',
    icon: 'users',
  },
  {
    id: 'volume-landmarks-overview',
    category: 'volume-landmarks',
    title: 'Volume Landmarks Explained',
    summary: 'MV, MEV, MAV, and MRV — your training volume roadmap.',
    content: 'Volume landmarks help you optimize your training:\n\n• MV (Maintenance Volume): The minimum volume to maintain your current fitness — typically 6-8 sets per muscle per week.\n\n• MEV (Minimum Effective Volume): The lowest volume that produces meaningful progress — usually around 8-10 sets per muscle per week.\n\n• MAV (Maximum Adaptive Volume): The sweet spot where you get the most growth — typically 12-18 sets per muscle per week.\n\n• MRV (Maximum Recoverable Volume): The upper limit your body can recover from — exceeding this leads to overtraining.',
    icon: 'bar-chart-3',
  },
  {
    id: 'progressive-overload',
    category: 'volume-landmarks',
    title: 'Progressive Overload',
    summary: 'Gradually increasing training stress to drive adaptation.',
    content: 'Progressive overload is the fundamental principle of training: to continue improving, you must gradually increase the demands placed on your body. This can be achieved by adding weight, increasing reps, adding sets, or improving exercise technique. In rehabilitation, progressive overload is applied more conservatively — the goal is to gradually increase tissue tolerance while monitoring symptoms. Start below your MEV and progressively work toward your MAV over weeks.',
    icon: 'arrow-up-right',
  },
  {
    id: 'sra-principle',
    category: 'volume-landmarks',
    title: 'The SRA Principle',
    summary: 'Stimulus → Recovery → Adaptation: the training cycle.',
    content: 'Every training session provides a Stimulus that causes fatigue. During Recovery, your body repairs and rebuilds. Through Adaptation, you become stronger/more resilient than before. The key is timing your next session so you train again after adaptation has occurred but before detraining begins. For most muscle groups, this means training 2-3 times per week. In rehab, the SRA cycle may be longer due to compromised recovery capacity.',
    icon: 'refresh-cw',
  },
  {
    id: 'fatigue-management',
    category: 'recovery',
    title: 'Fatigue Management',
    summary: 'Recognizing and managing training fatigue for optimal recovery.',
    content: 'Fatigue accumulates from training and life stressors. Signs include decreased performance, increased pain sensitivity, poor sleep, mood changes, and reduced motivation. Managing fatigue involves: monitoring your readiness daily, adjusting training volume when fatigue is high, prioritizing sleep (7-9 hours), managing psychological stress, and using nutrition to support recovery. Your daily check-in helps track these signals.',
    icon: 'battery-low',
  },
  {
    id: 'deload-strategies',
    category: 'recovery',
    title: 'Deload Strategies',
    summary: 'Planned periods of reduced training to facilitate recovery.',
    content: 'A deload is a planned reduction in training stress — typically lasting 1 week every 4-6 weeks. Options include:\n\n• Volume deload: Reduce sets by 50% while keeping intensity the same\n• Intensity deload: Reduce weight by 10-15% while keeping volume the same\n• Full deload: Reduce both volume and intensity\n\nIn rehabilitation, deloads are especially important when pain increases or readiness scores drop. They allow accumulated fatigue to dissipate and tissues to heal, setting the stage for future progress.',
    icon: 'pause-circle',
  },
  {
    id: 'sleep-recovery',
    category: 'recovery',
    title: 'Sleep & Recovery',
    summary: 'Sleep is the most powerful recovery tool available.',
    content: 'Sleep is when the majority of tissue repair, hormone production, and neural recovery occurs. Poor sleep increases pain sensitivity, impairs healing, reduces exercise performance, and worsens mood. Aim for 7-9 hours per night. Improve sleep quality by: maintaining a consistent schedule, keeping your room cool and dark, avoiding screens 1 hour before bed, limiting caffeine after noon, and using relaxation techniques if needed.',
    icon: 'moon',
  },
  {
    id: 'load-management-rehab',
    category: 'graded-exposure',
    title: 'Load Management in Rehab',
    summary: 'Balancing activity and rest to prevent tissue overload.',
    content: 'Load management is about finding the right balance between doing enough to promote healing and adaptation, and not doing so much that you aggravate symptoms. Key principles:\n\n• Start with activities you can do with minimal pain increase\n• Use the 24-hour pain response rule: if pain increases significantly for more than 24 hours after activity, you did too much\n• Progress by 10-20% per week when symptoms are stable\n• Some pain during activity is acceptable — aim for ≤3/10\n• Collaborate with your healthcare provider to set appropriate thresholds',
    icon: 'scale',
  },
  {
    id: 'fear-avoidance',
    category: 'graded-exposure',
    title: 'Breaking Fear-Avoidance',
    summary: 'Overcoming the cycle of pain, fear, and activity avoidance.',
    content: 'Fear-avoidance is a cycle where pain leads to fear of movement, which leads to avoiding activity, which leads to deconditioning and more pain. Breaking this cycle involves: education about pain (it\'s protective, not always harmful), gradual reintroduction of feared movements, building positive experiences with activity, and developing confidence in your body\'s resilience. Track your activities and pain responses to build evidence that movement is safe.',
    icon: 'shield-check',
  },
  {
    id: 'return-to-activity',
    category: 'graded-exposure',
    title: 'Return to Activity Framework',
    summary: 'A structured approach to getting back to the activities you love.',
    content: 'Returning to full activity is a graduated process:\n\n1. Pain Education: Understand your condition and what to expect\n2. Basic Movement: Restore pain-free range of motion\n3. Strength Building: Progressively load tissues using volume landmarks\n4. Functional Training: Sport/activity-specific movements\n5. Full Return: Gradual reintroduction to full activity\n\nAt each stage, monitor pain responses, track volume against your landmarks, and assess daily readiness. Progress when symptoms are stable; deload when they flare.',
    icon: 'flag',
  },
];

export const categoryLabels: Record<string, string> = {
  'pain-science': 'Pain Science',
  'volume-landmarks': 'Volume Landmarks',
  'recovery': 'Recovery',
  'graded-exposure': 'Graded Exposure',
};

export const categoryColors: Record<string, string> = {
  'pain-science': '#4A90D9',
  'volume-landmarks': '#2EC4B6',
  'recovery': '#F5A623',
  'graded-exposure': '#4CAF50',
};
