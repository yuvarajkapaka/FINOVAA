import React, { useState } from 'react';
import { 
  Building2, 
  Vault, 
  GraduationCap, 
  TrendingUp, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  Target, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  PlusCircle,
  ExternalLink,
  BookOpen,
  Briefcase,
  Award,
  Zap,
  MapPin
} from 'lucide-react';
import IsometricWorldMap from './IsometricWorldMap';

export default function FinancialWorld({
  wallet,
  goalsData,
  portfolioData,
  lessonsData,
  literacyScore,
  onNavigateTab,
  onSelectLesson,
  onOpenAction,
  onOpenCreateGoal,
  onOpenProfile,
  onOpenEvents
}) {
  const [selectedDistrictId, setSelectedDistrictId] = useState('WALLET');
  const [expandedMissionId, setExpandedMissionId] = useState(null);
  const [selectedMissionId, setSelectedMissionId] = useState(null);

  // Authoritative calculations from live backend data
  const availableCashPaise = wallet?.balances?.available_cash_paise || 0;
  const availableCashINR = (availableCashPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const savingsPaise = wallet?.balances?.savings_balance_paise || 0;
  const savingsINR = (savingsPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const portfolioValueINR = portfolioData?.valuation?.market_value_inr || 0;
  const formattedPortfolioValue = portfolioData?.valuation?.formatted_market_value || '₹0.00';
  const holdingsCount = portfolioData?.holdings?.length || 0;
  const marketCycle = portfolioData?.current_cycle || 1;

  const totalWealthPaise = availableCashPaise + savingsPaise;
  const totalNetWorthINR = ((totalWealthPaise / 100) + portfolioValueINR).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Goals & Reserves
  const goals = goalsData?.goals || [];
  const completedGoalsCount = goals.filter(g => g.progress_percentage >= 100).length;
  const emergencyGoal = goals.find(g => g.is_emergency_fund);
  const emergencyCoverageMonths = emergencyGoal?.target_paise > 0 
    ? ((emergencyGoal.current_paise / emergencyGoal.target_paise) * 6).toFixed(1) 
    : '0.0';

  // Academy Progress
  const completedLessonsCount = lessonsData?.progress?.completed_lessons_count || 0;
  const totalLessonsCount = lessonsData?.progress?.total_lessons_count || 15;
  const academyPercent = Math.round((completedLessonsCount / totalLessonsCount) * 100);
  const allLessons = lessonsData?.lessons || [];
  const nextLesson = allLessons.find(l => !l.completed) || allLessons[0];

  // Score & Exploration
  const scoreTotal = literacyScore?.total_score || 0;
  const scoreTier = literacyScore?.tier || 'Foundation Builder';
  const assetClassesExplored = literacyScore?.breakdown?.investment_learning?.asset_classes_explored || 0;
  const decisionScore = literacyScore?.breakdown?.decision_making?.score || 0;

  // District Definitions
  const districts = [
    {
      id: 'WALLET',
      districtNumber: '01',
      name: 'Money Center',
      role: 'Manage your income, expenses, and available money.',
      description: 'Manage your income, expenses, and available money.',
      icon: Building2,
      themeColor: 'forest',
      metricLabel: 'Available Money',
      metricValue: `₹${availableCashINR}`,
      metricSubtext: 'Ready to spend or save',
      status: 'Active',
      statusType: 'pos',
      availableActivities: [
        'Add money from your salary or income',
        'Record daily spending by category',
        'Check your transaction history',
        'Move extra money into savings'
      ],
      activeMissions: [
        {
          code: 'MISSION 01',
          name: 'Save for Emergencies',
          status: Number(emergencyCoverageMonths) >= 3.0 ? 'Complete' : 'In Progress'
        }
      ],
      recommendedNextAction: {
        title: 'Check Your Spending and Income',
        description: 'Record an income or expense so your records stay accurate.',
        actionLabel: 'Record Money Transaction',
        onAction: () => onOpenAction ? onOpenAction('INCOME') : onNavigateTab('WALLET')
      },
      completedObjectives: [
        'Starting money is available',
        'Overdraft protection is turned on'
      ],
      pendingObjectives: [
        'Keep spending less than income',
        'Move extra money into savings'
      ],
      missionsCount: 1,
      actionText: 'Open Money Center',
      quickAction: onOpenAction ? {
        label: '+ Add Income / Expense',
        onClick: () => onOpenAction('INCOME')
      } : null
    },
    {
      id: 'SAVINGS',
      districtNumber: '02',
      name: 'Savings Center',
      role: 'Save for emergencies and future goals.',
      description: 'Save for emergencies and future goals.',
      icon: Vault,
      themeColor: 'olive',
      metricLabel: 'Emergency Savings',
      metricValue: `₹${savingsINR}`,
      metricSubtext: `${emergencyCoverageMonths} of 6 Months Covered`,
      status: Number(emergencyCoverageMonths) >= 3 ? 'Safe Buffer' : 'Needs Funding',
      statusType: Number(emergencyCoverageMonths) >= 3 ? 'pos' : 'copper',
      availableActivities: [
        'Create savings goals for things you want',
        'Add money to your Emergency Savings',
        'Check how many months of expenses your savings cover',
        'Protect your savings from impulse spending'
      ],
      activeMissions: [
        {
          code: 'MISSION 01',
          name: 'Save for Emergencies',
          status: Number(emergencyCoverageMonths) >= 3.0 ? 'Complete' : 'In Progress'
        }
      ],
      recommendedNextAction: {
        title: Number(emergencyCoverageMonths) >= 3.0 ? 'Keep Your Savings Safe' : 'Add to Emergency Savings',
        description: Number(emergencyCoverageMonths) >= 3.0 
          ? 'You have at least 3 months of savings covered. Keep your goals funded.' 
          : 'Add money to your Emergency Savings until you have at least 3 months covered.',
        actionLabel: 'Open Savings Center',
        onAction: () => onNavigateTab('SAVINGS')
      },
      completedObjectives: [
        'Emergency Savings is set up',
        Number(emergencyCoverageMonths) >= 3 ? 'At least 3 months of emergency savings saved' : null
      ].filter(Boolean),
      pendingObjectives: [
        Number(emergencyCoverageMonths) < 3 ? 'Save at least 3 months of expenses' : null,
        'Reach 100% on your savings goals'
      ].filter(Boolean),
      missionsCount: 1,
      actionText: 'Open Savings Center',
      quickAction: onOpenCreateGoal ? {
        label: '+ New Savings Goal',
        onClick: onOpenCreateGoal
      } : null
    },
    {
      id: 'ACADEMY',
      districtNumber: '03',
      name: 'Learning Center',
      role: 'Learn about money through lessons and quizzes.',
      description: 'Learn about money through lessons and quizzes.',
      icon: GraduationCap,
      themeColor: 'forest',
      metricLabel: 'Lessons Completed',
      metricValue: `${completedLessonsCount} / ${totalLessonsCount}`,
      metricSubtext: `${academyPercent}% Completed`,
      status: completedLessonsCount === totalLessonsCount ? 'All Completed' : 'Lessons Available',
      statusType: completedLessonsCount === totalLessonsCount ? 'pos' : 'forest',
      availableActivities: [
        'Read 15 simple lessons about managing money',
        'Take quick quizzes to test your understanding',
        'Learn how money can grow over time',
        'Earn points for your Money Skills Score'
      ],
      activeMissions: [
        {
          code: 'MISSION 02',
          name: 'Learn About Money',
          status: completedLessonsCount >= 1 ? 'Complete' : 'In Progress'
        }
      ],
      recommendedNextAction: {
        title: nextLesson ? `Resume Lesson #${nextLesson.id}: ${nextLesson.title}` : 'All Lessons Finished',
        description: nextLesson 
          ? 'Complete this short lesson and take the quiz to earn points.'
          : 'Great job! You finished all 15 lessons.',
        actionLabel: nextLesson && onSelectLesson ? `Open Lesson #${nextLesson.id}` : 'Open Learning Center',
        onAction: () => nextLesson && onSelectLesson ? onSelectLesson(nextLesson.id) : onNavigateTab('ACADEMY')
      },
      completedObjectives: [
        completedLessonsCount >= 1 ? `Finished first lesson` : null,
        completedLessonsCount >= 5 ? `Finished 5 lessons` : null
      ].filter(Boolean),
      pendingObjectives: [
        completedLessonsCount < totalLessonsCount ? `Finish ${totalLessonsCount - completedLessonsCount} more lessons` : 'Review lessons'
      ],
      missionsCount: 1,
      actionText: 'Open Learning Center',
      quickAction: nextLesson && onSelectLesson ? {
        label: `Resume: Lesson #${nextLesson.id}`,
        onClick: () => onSelectLesson(nextLesson.id)
      } : null
    },
    {
      id: 'MARKET',
      districtNumber: '04',
      name: 'Investment Center',
      role: 'Explore virtual investments and learn how they work.',
      description: 'Explore virtual investments and learn how they work.',
      icon: TrendingUp,
      themeColor: 'copper',
      metricLabel: 'Your Investments',
      metricValue: formattedPortfolioValue,
      metricSubtext: `${holdingsCount} Investments Owned`,
      status: (holdingsCount > 0 || assetClassesExplored > 0) ? 'Active' : 'Not Started',
      statusType: (holdingsCount > 0 || assetClassesExplored > 0) ? 'pos' : 'copper',
      availableActivities: [
        'Look at different virtual investments (Index Funds, Bonds, Gold)',
        'Compare 2 investments side by side',
        'Practice buying and selling with virtual money',
        'See how prices can go up and down over time'
      ],
      activeMissions: [
        {
          code: 'MISSION 03',
          name: 'Explore Investments',
          status: (assetClassesExplored >= 1 || holdingsCount > 0) ? 'Complete' : 'In Progress'
        }
      ],
      recommendedNextAction: {
        title: 'Inspect an Investment',
        description: 'Click any investment card to learn what it does and see its price history without buying.',
        actionLabel: 'Inspect Investments',
        onAction: () => onNavigateTab('MARKET')
      },
      completedObjectives: [
        (assetClassesExplored > 0 || holdingsCount > 0) ? `Inspected ${assetClassesExplored} investment types` : null,
        holdingsCount > 0 ? `Own ${holdingsCount} virtual investments` : null
      ].filter(Boolean),
      pendingObjectives: [
        (assetClassesExplored === 0 && holdingsCount === 0) ? 'Inspect an investment to complete Mission 03' : 'See how market cycles change prices'
      ],
      missionsCount: 1,
      actionText: 'Open Investment Center',
      quickAction: null
    },
    {
      id: 'SIMULATION',
      districtNumber: '05',
      name: 'Challenge Center',
      role: 'Solve money problems and compare your choices.',
      description: 'Solve money problems and compare your choices.',
      icon: BarChart3,
      themeColor: 'forest',
      metricLabel: '5 Challenges',
      metricValue: 'Problem Lab',
      metricSubtext: 'Zero Risk to Real Accounts',
      status: 'Ready',
      statusType: 'forest',
      availableActivities: [
        'Step through real-world situations: Event, Investigate, Choose, Outcome, Compare, Learn',
        'Compare what happens with each choice side by side',
        'Practice handling unexpected repairs, raises, and price drops',
        'Learn without risking any of your actual virtual money'
      ],
      activeMissions: [
        {
          code: 'MISSION 04',
          name: 'Handle a Money Problem',
          status: decisionScore >= 3.0 ? 'Complete' : 'In Progress'
        },
        {
          code: 'MISSION 05',
          name: 'Make Smarter Choices',
          status: scoreTotal >= 40.0 ? 'Complete' : 'In Progress'
        }
      ],
      recommendedNextAction: {
        title: 'Try a Money Challenge',
        description: 'See how your choices help you handle surprises like sudden bills or price drops.',
        actionLabel: 'Open Challenges',
        onAction: () => onNavigateTab('SIMULATION')
      },
      completedObjectives: [
        decisionScore >= 3.0 ? 'Tested at least 1 challenge' : null
      ].filter(Boolean),
      pendingObjectives: [
        'Try all 5 real-life money challenges',
        'Compare your choices side by side'
      ],
      missionsCount: 2,
      actionText: 'Open Challenges',
      quickAction: null
    }
  ];

  const activeDistrict = districts.find(d => d.id === selectedDistrictId) || districts[0];

  // 5 Playable Strategic Missions (Each featuring complete 8-step sequence)
  const strategicMissions = [
    {
      id: 'MISSION_01',
      code: 'MISSION 01',
      title: 'SAVE FOR EMERGENCIES',
      districtName: 'Savings Center',
      objective: 'Unexpected expenses can happen at any time. Build savings so you can handle them without financial stress.',
      criteria: 'Keep emergency savings covering at least 3 months of expenses',
      recommendedActionSummary: 'Open Savings Center and add money to your Emergency Savings',
      progressText: `${emergencyCoverageMonths} / 3.0 Months Covered`,
      percentage: Math.min(100, Math.round((Number(emergencyCoverageMonths) / 3.0) * 100)),
      isCompleted: Number(emergencyCoverageMonths) >= 3.0,
      learnedTakeaway: 'Having 3 to 6 months of living expenses saved protects you when unexpected surprises happen.',
      actionText: 'Open Savings Center',
      onAction: () => onNavigateTab('SAVINGS'),
      step1_intro: 'Situation: Unexpected expenses like phone repairs, medical bills, or job interruptions can occur at any time.',
      step2_objective: 'Objective: Build emergency savings covering at least 3 months of living expenses so you can handle shocks safely.',
      step3_investigation: `Investigation: Your emergency cushion covers ${emergencyCoverageMonths} months. Essential benchmark is 3.0 to 6.0 months.`,
      step4_action: 'Action: Open Savings Center and allocate money from available cash into your Emergency Savings.',
      step5_result: `Result: Current verified coverage is ${emergencyCoverageMonths} / 3.0 months. Real funds are safely recorded in the ledger.`,
      step6_lesson: 'Lesson: Emergency savings prevents high-interest debt and stops you from having to sell investments at a loss.',
      step7_progress: Number(emergencyCoverageMonths) >= 3.0 ? 'Verified Complete: Target 3.0 months reached.' : 'In Progress: Continue adding funds to reach 3.0 months.',
      step8_next: 'Next Mission: Complete Mission 02 (Learn About Money) in Learning Center.'
    },
    {
      id: 'MISSION_02',
      code: 'MISSION 02',
      title: 'LEARN ABOUT MONEY',
      districtName: 'Learning Center',
      objective: 'Complete a lesson and test what you learned with a quick quiz.',
      criteria: 'Complete at least 1 lesson and quiz',
      recommendedActionSummary: nextLesson ? `Resume Lesson #${nextLesson.id}: ${nextLesson.title}` : 'Open Learning Center',
      progressText: `${completedLessonsCount} / ${totalLessonsCount} Lessons Completed`,
      percentage: academyPercent,
      isCompleted: completedLessonsCount >= 1,
      learnedTakeaway: 'Learning the basics of money helps you make smarter choices and avoid costly mistakes.',
      actionText: nextLesson ? `Resume Lesson #${nextLesson.id}` : 'Review Lessons',
      onAction: () => {
        if (nextLesson && onSelectLesson) {
          onSelectLesson(nextLesson.id);
        } else {
          onNavigateTab('ACADEMY');
        }
      },
      step1_intro: 'Situation: Without financial knowledge, it is easy to make costly choices like carrying debt or panic-selling.',
      step2_objective: 'Objective: Read at least 1 lesson in the Learning Center and complete its comprehension quiz.',
      step3_investigation: `Investigation: You have finished ${completedLessonsCount} of ${totalLessonsCount} lessons. Recommended lesson: ${nextLesson?.title || 'Lesson 1'}.`,
      step4_action: nextLesson ? `Action: Start Lesson #${nextLesson.id} and submit your answers to the quiz.` : 'Action: Review finished lessons.',
      step5_result: `Result: ${completedLessonsCount} lessons recorded as complete in your verified curriculum profile.`,
      step6_lesson: 'Lesson: Consistent study of money concepts builds the confidence to make smart daily decisions.',
      step7_progress: completedLessonsCount >= 1 ? 'Verified Complete: At least 1 lesson finished.' : 'In Progress: Finish 1 lesson quiz to unlock.',
      step8_next: 'Next Mission: Explore Investment Center in Mission 03.'
    },
    {
      id: 'MISSION_03',
      code: 'MISSION 03',
      title: 'EXPLORE INVESTMENTS',
      districtName: 'Investment Center',
      objective: 'Look at a virtual investment to learn how money can grow over time.',
      criteria: 'Inspect at least 1 investment',
      recommendedActionSummary: 'Open Investment Center and inspect an investment',
      progressText: (assetClassesExplored >= 1 || holdingsCount > 0)
        ? `${Math.max(assetClassesExplored, holdingsCount)} Investments Inspected`
        : 'Inspect an investment in Investment Center',
      percentage: (assetClassesExplored >= 1 || holdingsCount > 0) ? 100 : 0,
      isCompleted: (assetClassesExplored >= 1 || holdingsCount > 0),
      learnedTakeaway: 'Spreading money across different investments balances risk so you do not rely on just one thing.',
      actionText: 'Open Investment Center',
      onAction: () => onNavigateTab('MARKET'),
      step1_intro: 'Situation: Cash sitting idle loses purchasing power to inflation over years. Investments let money grow.',
      step2_objective: 'Objective: Explore the Investment Center, inspect an asset, and review its price history and risk profile.',
      step3_investigation: `Investigation: Asset classes inspected: ${assetClassesExplored}. Virtual holdings owned: ${holdingsCount}.`,
      step4_action: 'Action: Open Investment Center and inspect an index fund or bond asset card.',
      step5_result: (assetClassesExplored >= 1 || holdingsCount > 0) ? 'Result: Verified asset exploration recorded in scoring rubric.' : 'Result: Pending initial asset review.',
      step6_lesson: 'Lesson: Diversifying across asset classes protects your portfolio while giving your wealth room to grow.',
      step7_progress: (assetClassesExplored >= 1 || holdingsCount > 0) ? 'Verified Complete: Asset inspected.' : 'In Progress: Open marketplace to inspect.',
      step8_next: 'Next Mission: Test your decision skills in Mission 04.'
    },
    {
      id: 'MISSION_04',
      code: 'MISSION 04',
      title: 'HANDLE A MONEY PROBLEM',
      districtName: 'Challenge Center',
      objective: 'Solve a money surprise in Challenges and see what happens with each choice.',
      criteria: 'Complete at least 1 challenge scenario',
      recommendedActionSummary: 'Open Challenges and test a money problem',
      progressText: decisionScore >= 3.0 ? 'Challenge Completed' : '5 Challenges Available',
      percentage: decisionScore >= 3.0 ? 100 : 0,
      isCompleted: decisionScore >= 3.0,
      learnedTakeaway: 'Practicing choices ahead of time prepares you to handle surprises in real life with confidence.',
      actionText: 'Open Challenges',
      onAction: () => onNavigateTab('SIMULATION'),
      step1_intro: 'Situation: Sudden expenses like phone repairs or market drops require calm, rational trade-offs.',
      step2_objective: 'Objective: Step through a challenge in Challenges, compare choices side by side, and review outcomes.',
      step3_investigation: 'Investigation: Challenges simulate outcomes without altering your real virtual cash or savings.',
      step4_action: 'Action: Launch a challenge, select a strategy, and inspect the quantitative consequences.',
      step5_result: decisionScore >= 3.0 ? 'Result: Scenario evaluated and decision comparison recorded.' : 'Result: 5 challenges ready to play.',
      step6_lesson: 'Lesson: Evaluating choices ahead of time gives you a clear mental model when real surprises arise.',
      step7_progress: decisionScore >= 3.0 ? 'Verified Complete: Decision score >= 3.0.' : 'In Progress: Complete 1 challenge to fulfill.',
      step8_next: 'Next Mission: Reach a 40+ Money Skills Score in Mission 05.'
    },
    {
      id: 'MISSION_05',
      code: 'MISSION 05',
      title: 'MAKE SMARTER CHOICES',
      districtName: 'Money Skills Score',
      objective: 'Practice balanced saving, learning, and decision-making to raise your score.',
      criteria: 'Reach a Money Skills Score of at least 40 out of 100',
      recommendedActionSummary: 'Review your score breakdown and complete remaining activities',
      progressText: `${scoreTotal.toFixed(1)} / 100 Points`,
      percentage: Math.min(100, Math.round(scoreTotal)),
      isCompleted: scoreTotal >= 40.0,
      learnedTakeaway: 'Good money habits come from a balance of saving money, learning facts, and making careful decisions.',
      actionText: 'View Money Skills Score',
      onAction: () => onNavigateTab('SCORE'),
      step1_intro: 'Situation: True financial resilience comes from balanced habits across saving, knowledge, and wise decisions.',
      step2_objective: 'Objective: Reach a total Money Skills Score of at least 40.0 points on the 100-point merit scale.',
      step3_investigation: `Investigation: Current Score: ${scoreTotal.toFixed(1)} / 100.0 pts. Current Tier: ${scoreTier}.`,
      step4_action: 'Action: Review your score breakdown across the 4 areas and fulfill remaining milestones.',
      step5_result: scoreTotal >= 40.0 ? `Result: Goal reached with ${scoreTotal.toFixed(1)} pts.` : `Result: Currently at ${scoreTotal.toFixed(1)} / 40.0 pts.`,
      step6_lesson: 'Lesson: Long-term wealth is built on consistent daily disciplines, not risky gambles or quick tricks.',
      step7_progress: scoreTotal >= 40.0 ? 'Verified Complete: Score >= 40.0.' : `In Progress: Need ${(40.0 - scoreTotal).toFixed(1)} more points.`,
      step8_next: 'Next Activity: Maintain emergency cushion and advance market cycles.'
    }
  ];

  const currentObjectiveMission = strategicMissions.find(m => !m.isCompleted) || null;
  const completedMissionsCount = strategicMissions.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* =========================================================================
          PHASE 1: POLISHED GAME STATUS AREA (FINOVA HOME BASE)
      ========================================================================= */}
      <section className="bg-canvas-white border border-edge rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-6">
        {/* Subtle architectural grid backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#254B3B_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header & Barometer */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-edge">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
              <span>GAME HOME BASE • CYCLE #{marketCycle}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-semibold tracking-tight">
              Financial World
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Explore five economic centers, complete missions, solve money problems, and build lifelong money skills.
            </p>
          </div>

          {/* Game Status Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-canvas-subtle p-3 rounded-2xl border border-edge">
            <div className="p-3 bg-canvas-white rounded-xl border border-edge/80">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block">Available Money</span>
              <span className="font-mono text-base sm:text-lg font-bold text-ink">₹{availableCashINR}</span>
            </div>
            <div className="p-3 bg-canvas-white rounded-xl border border-edge/80">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block">Money Skills Score</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-mono text-base sm:text-lg font-bold text-forest">{scoreTotal.toFixed(1)}</span>
                <span className="text-xs text-ink-subtle font-mono">/ 100</span>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 bg-canvas-white rounded-xl border border-edge/80">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block">Completed Missions</span>
              <span className="text-xs sm:text-sm font-semibold text-copper mt-0.5 block font-mono">
                {completedMissionsCount} of {strategicMissions.length} Complete
              </span>
            </div>
          </div>
        </div>

        {/* Polished Two-Pillar Directive Cards: CURRENT MISSION & NEXT CHALLENGE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
          {/* 1. YOUR CURRENT MISSION */}
          <div className="bg-canvas-subtle border-2 border-forest/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs transition-all duration-250 hover:-translate-y-1.5 hover:shadow-lg hover:border-forest/60">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-forest text-canvas-white font-mono uppercase tracking-wider">
                  YOUR CURRENT MISSION
                </span>
                <span className="text-xs font-semibold text-ink-muted">
                  {currentObjectiveMission ? currentObjectiveMission.code : '5/5 COMPLETE'}
                </span>
              </div>

              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  {currentObjectiveMission ? currentObjectiveMission.title : 'ALL MISSIONS COMPLETE'}
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  {currentObjectiveMission
                    ? currentObjectiveMission.objective
                    : 'You have mastered all primary financial strategy objectives! Continue playing challenges or exploring investments.'}
                </p>
              </div>

              {/* Progress from real data */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-muted font-medium">Mission Progress:</span>
                  <span className="font-mono font-bold text-forest">
                    {currentObjectiveMission ? currentObjectiveMission.progressText : '100% Achieved'}
                  </span>
                </div>
                <div className="w-full bg-edge rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-forest h-full rounded-full transition-all duration-500" 
                    style={{ width: `${currentObjectiveMission ? currentObjectiveMission.percentage : 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-edge flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                {currentObjectiveMission ? `Location: ${currentObjectiveMission.districtName}` : 'All Objectives Met'}
              </span>
              <button
                onClick={currentObjectiveMission ? currentObjectiveMission.onAction : () => onNavigateTab('SAVINGS')}
                className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 shadow-sm flex items-center space-x-1.5 active:scale-95"
              >
                <span>{currentObjectiveMission ? 'CONTINUE MISSION' : 'REVIEW MISSIONS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. YOUR NEXT CHALLENGE */}
          <div className="bg-canvas-subtle border border-edge rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs transition-all duration-250 hover:-translate-y-1.5 hover:shadow-lg hover:border-forest/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-copper/15 text-copper border border-copper/30 font-mono uppercase tracking-wider">
                  YOUR NEXT CHALLENGE
                </span>
                <span className="text-xs font-semibold text-copper">
                  5 Scenarios Ready
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  An unexpected expense has appeared.
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Your phone broke down unexpectedly. Can you choose the best way to handle it without financial stress?
                </p>
              </div>

              <div className="p-3 bg-canvas-white rounded-xl border border-edge text-xs space-y-1">
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-copper" />
                  <span>Zero Real Money Risk</span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Compare real choices side by side: use emergency savings, take from daily cash, or delay the purchase.
                </p>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-edge flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                Everyday Money Dilemma
              </span>
              <button
                onClick={onOpenEvents ? onOpenEvents : () => onNavigateTab('SIMULATION')}
                className="px-5 py-2.5 rounded-xl bg-copper hover:bg-copper-dark text-canvas-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5 active:scale-95"
              >
                <span>START CHALLENGE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: PLAYABLE ISOMETRIC ECONOMIC WORLD MAP
      ========================================================================= */}
      <section className="space-y-4">
        <IsometricWorldMap
          selectedDistrictId={selectedDistrictId}
          onSelectDistrict={setSelectedDistrictId}
          onEnterDistrict={onNavigateTab}
          wallet={wallet}
          goalsData={goalsData}
          portfolioData={portfolioData}
          lessonsData={lessonsData}
        />
      </section>

      {/* =========================================================================
          SECTION 2: ACTIVE DISTRICT STRATEGIC COMMAND CONSOLE
      ========================================================================= */}
      <section 
        key={activeDistrict.id} 
        className="bg-canvas-white border border-forest/30 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 panel-enter transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-edge pb-5">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-forest/10 text-forest border border-forest/20">
              <activeDistrict.icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-canvas-white uppercase font-mono">
                  Center {activeDistrict.districtNumber}
                </span>
                <span className="text-xs text-ink-muted">• {activeDistrict.role}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink mt-1">
                {activeDistrict.name}
              </h2>
              <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
                {activeDistrict.description}
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            {activeDistrict.quickAction && (
              <button
                onClick={activeDistrict.quickAction.onClick}
                className="px-4 py-2.5 rounded-xl bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-semibold transition"
              >
                {activeDistrict.quickAction.label}
              </button>
            )}

            <button
              onClick={() => onNavigateTab(activeDistrict.id)}
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm flex items-center space-x-2 active:scale-95"
            >
              <span>{activeDistrict.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telemetry, Activities, and Action Rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Actual District Statistics */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
              {activeDistrict.metricLabel}
            </span>
            <span className="font-mono text-2xl font-bold text-ink block">
              {activeDistrict.metricValue}
            </span>
            <span className="text-[11px] text-ink-subtle block">
              {activeDistrict.metricSubtext}
            </span>
            <div className="pt-2 border-t border-edge/60 flex items-center justify-between text-[11px]">
              <span className="text-ink-muted">Status:</span>
              <span className="font-semibold text-forest">{activeDistrict.status}</span>
            </div>
          </div>

          {/* Column 2: Available District Activities */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-forest" />
              What You Can Do Here
            </span>
            <div className="space-y-1.5 text-xs text-ink">
              {activeDistrict.availableActivities?.map((act, i) => (
                <div key={i} className="flex items-start space-x-1.5 text-[11px] text-ink-muted">
                  <span className="w-1 h-1 rounded-full bg-forest mt-1.5 shrink-0" />
                  <span className="leading-snug">{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Recommended Next Action */}
          <div className="p-4 rounded-2xl bg-forest/5 border border-forest/20 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-forest" />
                Recommended Next Step
              </span>
              <h4 className="font-serif font-bold text-xs text-ink">
                {activeDistrict.recommendedNextAction?.title}
              </h4>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                {activeDistrict.recommendedNextAction?.description}
              </p>
            </div>
            {activeDistrict.recommendedNextAction && (
              <button
                onClick={activeDistrict.recommendedNextAction.onAction}
                className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 mt-2"
              >
                <span>{activeDistrict.recommendedNextAction.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Missions and Objectives Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-edge/60">
          {/* Active Missions in this District */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-copper block flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-copper" />
              Active Missions
            </span>
            <div className="space-y-2 text-xs">
              {activeDistrict.activeMissions?.map((m, i) => (
                <div key={i} className="p-2 rounded-xl bg-canvas-white border border-edge/70 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-ink-subtle block">{m.code}</span>
                    <span className="text-[11px] font-semibold text-ink leading-tight">{m.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'Complete' ? 'bg-pos/10 text-pos' : 'bg-copper/10 text-copper'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Objectives */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pos block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-pos" />
              Completed Objectives
            </span>
            <div className="space-y-1.5 text-xs text-ink">
              {activeDistrict.completedObjectives.length > 0 ? (
                activeDistrict.completedObjectives.map((obj, i) => (
                  <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-pos shrink-0" />
                    <span>{obj}</span>
                  </div>
                ))
              ) : (
                <span className="text-ink-muted text-[11px]">No objectives completed yet</span>
              )}
            </div>
          </div>

          {/* Incomplete / In-Progress Objectives */}
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-edge space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-copper block flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-copper" />
              Strategic Next Targets
            </span>
            <div className="space-y-1.5 text-xs text-ink">
              {activeDistrict.pendingObjectives.map((obj, i) => (
                <div key={i} className="flex items-center space-x-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-copper shrink-0" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Financial Events Banner */}
        {onOpenEvents && (
          <div className="p-4 rounded-2xl bg-forest/5 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-forest/10 text-forest border border-forest/20 shrink-0">
                <Sparkles className="w-5 h-5 text-forest" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-ink">
                  Interactive Financial Events & Dilemmas
                </h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Play through 5 authentic scenarios: Unexpected ₹15,000 Expense, Income Windfall, Reserve Discipline, Market Downturn, and Goal Savings. Zero real-account balance risk.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenEvents}
              className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shrink-0 flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Financial Events</span>
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: 5 STRATEGIC MISSIONS SYSTEM (PRIMARY GAMEPLAY LOOP)
      ========================================================================= */}
      <section className="bg-canvas-white border border-edge rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-copper" />
              <h3 className="font-serif text-xl font-bold text-ink">
                Strategic Mission Operations
              </h3>
            </div>
            <p className="text-xs text-ink-muted">
              The primary gameplay loop. Progress is calculated strictly from verified application state and database records.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                Missions Completed
              </span>
              <span className="font-mono text-sm font-bold text-forest">
                {completedMissionsCount} of {strategicMissions.length} Objectives
              </span>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3.5 py-2 rounded-xl bg-forest/10 hover:bg-forest/20 text-forest border border-forest/20 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Player Profile & Milestones</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Missions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategicMissions.map((mission) => {
            const nextAvailableId = strategicMissions.find(m => !m.isCompleted)?.id;
            const isSelected = selectedMissionId === mission.id;
            const isNextAvailable = !mission.isCompleted && mission.id === nextAvailableId;

            return (
              <div 
                key={mission.id}
                onClick={() => setSelectedMissionId(prev => prev === mission.id ? null : mission.id)}
                className={`p-5 rounded-2xl border transition-all duration-250 ease-out cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-lg ${
                  isSelected
                    ? 'bg-canvas-white border-forest ring-2 ring-forest/40 shadow-lg -translate-y-1.5'
                    : isNextAvailable
                    ? 'bg-canvas-white border-copper/50 ring-1 ring-copper/30 hover:border-forest/60'
                    : mission.isCompleted 
                    ? 'bg-canvas-subtle/50 border-edge opacity-95 hover:bg-canvas-white hover:border-edge-dark' 
                    : 'bg-canvas-subtle border-edge/90 hover:bg-canvas-white hover:border-forest/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-canvas-white text-ink-muted border border-edge uppercase tracking-wider font-mono">
                        {mission.code}
                      </span>
                      {isNextAvailable && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-copper/10 text-copper uppercase font-mono shadow-xs">
                          Next Target
                        </span>
                      )}
                    </div>
                    {mission.isCompleted ? (
                      <span className="text-xs font-semibold text-pos flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-pos completion-pop" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-copper">
                        Active Objective
                      </span>
                    )}
                  </div>

                <div>
                  <h4 className="font-serif text-base font-bold text-ink">
                    {mission.title}
                  </h4>
                  <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-semibold block mt-0.5">
                    Location: {mission.districtName}
                  </span>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    {mission.objective}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-ink-muted font-medium text-[11px]">Progress:</span>
                    <span className="font-mono text-xs font-bold text-ink">{mission.progressText}</span>
                  </div>
                  <div className="w-full bg-edge/70 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        mission.isCompleted ? 'bg-pos' : 'bg-forest'
                      }`}
                      style={{ width: `${mission.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Educational Takeaway & 8-Step Guide Trigger */}
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-canvas-white border border-edge/80 text-[11px] text-ink-muted leading-relaxed">
                    <strong className="text-ink font-semibold">Educational Takeaway: </strong>
                    {mission.learnedTakeaway}
                  </div>

                  <button
                    onClick={() => setExpandedMissionId(expandedMissionId === mission.id ? null : mission.id)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-canvas-white hover:bg-canvas-subtle border border-edge text-[11px] font-semibold text-ink flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-1.5 text-forest font-bold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{expandedMissionId === mission.id ? 'Hide 8-Step Sequence' : 'View 8-Step Mission Guide'}</span>
                    </span>
                    <span className="text-[10px] text-ink-subtle">{expandedMissionId === mission.id ? '▲ Close' : '▼ Details'}</span>
                  </button>

                  {/* Complete 8-Step Sequential Walkthrough */}
                  {expandedMissionId === mission.id && (
                    <div className="p-3.5 rounded-xl bg-canvas-white border border-edge/90 text-xs space-y-2.5 panel-enter">
                      <span className="font-serif font-bold text-ink text-xs block pb-1 border-b border-edge">
                        8-Step Gameplay Sequence:
                      </span>
                      <div className="space-y-2 text-[11px] text-ink-muted">
                        <div>
                          <strong className="text-forest block">1. INTRODUCTION</strong>
                          <p>{mission.step1_intro}</p>
                        </div>
                        <div>
                          <strong className="text-forest block">2. OBJECTIVE</strong>
                          <p>{mission.step2_objective}</p>
                        </div>
                        <div>
                          <strong className="text-forest block">3. INVESTIGATION</strong>
                          <p>{mission.step3_investigation}</p>
                        </div>
                        <div>
                          <strong className="text-forest block">4. ACTION</strong>
                          <p className="text-ink font-semibold">{mission.step4_action}</p>
                        </div>
                        <div>
                          <strong className="text-forest block">5. RESULT</strong>
                          <p>{mission.step5_result}</p>
                        </div>
                        <div>
                          <strong className="text-forest block">6. LESSON</strong>
                          <p>{mission.step6_lesson}</p>
                        </div>
                        <div>
                          <strong className="text-forest block">7. PROGRESS</strong>
                          <p>{mission.step7_progress}</p>
                        </div>
                        <div>
                          <strong className="text-copper block">8. NEXT MISSION</strong>
                          <p className="text-ink font-semibold">{mission.step8_next}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="mt-4 pt-3 border-t border-edge flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">
                  {mission.isCompleted ? 'Verified condition' : 'Execute action'}
                </span>
                <button
                  onClick={mission.onAction}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    mission.isCompleted
                      ? 'bg-canvas-white text-ink border border-edge hover:bg-canvas-subtle'
                      : 'bg-forest hover:bg-forest-light text-canvas-white shadow-xs'
                  }`}
                >
                  <span>{mission.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        </div>
      </section>
    </div>
  );
}
