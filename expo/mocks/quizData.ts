export interface QuizQuestion {
  id: number;
  statement: string;
  answer: boolean;
  explanation: string;
}

export const painScienceQuiz: QuizQuestion[] = [
  {
    id: 1,
    statement: 'Pain always means there is tissue damage occurring in your body.',
    answer: false,
    explanation: 'Pain is a protective output of the brain, not a direct measure of tissue damage. Many people have tissue changes (like disc bulges) with no pain, and others experience significant pain with no identifiable tissue pathology. Pain is influenced by context, beliefs, and past experiences.',
  },
  {
    id: 2,
    statement: 'The biopsychosocial model recognizes that biological, psychological, and social factors all contribute to the pain experience.',
    answer: true,
    explanation: 'Research shows that pain is never purely physical. Stress, sleep, beliefs about your body, fear of movement, and social support all modulate how much pain you experience. Effective rehab addresses all three domains.',
  },
  {
    id: 3,
    statement: 'Avoiding all painful movements is the safest strategy for recovery.',
    answer: false,
    explanation: 'Avoiding movement due to pain often leads to fear-avoidance, deconditioning, and increased sensitivity over time. Graded exposure — gradually reintroducing movement — helps desensitize the nervous system and rebuild confidence in your body.',
  },
  {
    id: 4,
    statement: 'Tissues in the body can adapt and become stronger when progressively loaded over time.',
    answer: true,
    explanation: 'Bones, tendons, muscles, and ligaments all respond to progressive loading by becoming stronger and more resilient. This is a core principle of rehabilitation — tissues need appropriate stress to heal and adapt.',
  },
  {
    id: 5,
    statement: 'If an MRI shows a disc bulge, it is the definitive cause of your back pain.',
    answer: false,
    explanation: 'Imaging findings like disc bulges, degenerative changes, and arthritis are extremely common in people with NO pain. Studies show that many structural changes are normal age-related findings. Imaging alone cannot determine the cause of pain.',
  },
  {
    id: 6,
    statement: 'Your nervous system can become more sensitive over time, amplifying pain signals even after tissues have healed.',
    answer: true,
    explanation: 'Central sensitization is a well-documented phenomenon where the nervous system "turns up the volume" on pain signals. This means you can experience real pain even after tissues have fully recovered. Education and graded activity help reverse this process.',
  },
  {
    id: 7,
    statement: 'You need to find and fix the exact structural problem to eliminate pain.',
    answer: false,
    explanation: 'Modern pain science shows that the "find it and fix it" model is outdated. Pain is multifactorial — it involves sensitivity, load tolerance, beliefs, stress, and more. Recovery focuses on building capacity, calming sensitivity, and addressing the whole person, not hunting for a single broken part.',
  },
  {
    id: 8,
    statement: 'Sleep quality, stress levels, and overall mood can directly influence how much pain you feel.',
    answer: true,
    explanation: 'Poor sleep increases pain sensitivity. High stress and negative mood lower your pain threshold. These factors act like a "volume knob" on the nervous system — when life stress is high, the same stimulus can feel significantly more painful.',
  },
  {
    id: 9,
    statement: 'Some pain during rehabilitation exercises always means you are causing harm.',
    answer: false,
    explanation: 'Experiencing some discomfort during rehab exercises (generally ≤3/10) is often acceptable and does not indicate damage. Pain during activity is common in recovery and can be safely navigated with proper load management. The 24-hour response rule is a better guide than in-the-moment pain.',
  },
  {
    id: 10,
    statement: 'Building confidence in your body\'s ability to move is an important part of pain recovery.',
    answer: true,
    explanation: 'Self-efficacy — believing in your ability to cope and recover — is one of the strongest predictors of positive outcomes. Graded exposure, tracking progress, and positive movement experiences all help build this confidence, which in turn reduces the brain\'s perceived need to produce pain.',
  },
];
