import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Target, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Info, 
  Layers, 
  BookOpen, 
  Scale, 
  Compass,
  Check,
  ChevronRight,
  TrendingDown,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function FinancialEventsModal({
  isOpen,
  onClose,
  wallet,
  goalsData,
  portfolioData,
  onCompleteEvent
}) {
  const [selectedEventId, setSelectedEventId] = useState('EVENT_A');
  // 8-step sequence:
  // 1: INTRO | 2: INVESTIGATE | 3: INFO | 4: CHOOSE | 5: CONSEQUENCES | 6: TRADEOFFS | 7: PRINCIPLE | 8: REPLAY_CONTINUE
  const [activeStep, setActiveStep] = useState(1);
  const [selectedChoiceId, setSelectedChoiceId] = useState('A1');

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Real snapshot of current accounts (Used as immutable baseline for deterministic calculations)
  const liquidCashPaise = wallet?.balances?.available_cash_paise || 0;
  const liquidCashINR = liquidCashPaise / 100;
  const savingsPaise = wallet?.balances?.savings_balance_paise || 0;
  const savingsINR = savingsPaise / 100;
  const portfolioINR = portfolioData?.valuation?.market_value_inr || 0;
  const emergencyGoal = goalsData?.goals?.find(g => g.is_emergency_fund);
  const emergencyINR = emergencyGoal ? (emergencyGoal.current_paise / 100) : savingsINR;
  const baselineTotalNetINR = liquidCashINR + savingsINR + portfolioINR;

  const events = [
    {
      id: 'EVENT_A',
      letter: 'A',
      title: 'Your phone needs a ₹5,000 repair',
      tag: 'Emergency Savings',
      amountINR: 5000,
      description: 'Your phone broke down unexpectedly and needs an urgent repair costing ₹5,000.',
      investigation: {
        timeline: 'The repair must be paid within 24 hours to get your phone working again.',
        financialRisk: 'Paying without checking your money could leave you short for daily bills.',
        constraints: 'This is an unplanned repair that you cannot easily postpone.',
        balanceContext: `Available Money: ₹${liquidCashINR.toLocaleString('en-IN')}; Emergency Savings: ₹${savingsINR.toLocaleString('en-IN')}.`
      },
      choices: [
        {
          id: 'A1',
          title: 'Pay from Emergency Savings',
          summary: 'Use ₹5,000 from your dedicated emergency savings to pay the bill.',
          deltaCash: 0,
          deltaSavings: -5000,
          deltaPortfolio: 0,
          whatChanged: 'Your emergency savings decreased by ₹5,000; your daily available money remained untouched.',
          whyItChanged: 'Your emergency savings did its job by covering an unexpected repair.',
          whatGained: 'Daily money remains safe for routine expenses; no investments were sold; no debt taken.',
          whatGaveUp: 'Your emergency savings is temporarily lower by ₹5,000 and should be rebuilt.',
          tradeoffAnalysis: {
            advantages: ['Daily money stays completely intact', 'No investments sold at a bad time', 'Exactly what emergency savings is meant for'],
            limitations: ['You have ₹5,000 less emergency cushion until you rebuild it']
          },
          principle: 'Emergency savings is like insurance. Its real value is protecting you from costly debt and forced sales when surprises happen.'
        },
        {
          id: 'A2',
          title: 'Pay from Daily Available Money',
          summary: 'Take the full ₹5,000 out of your daily spending money.',
          deltaCash: -5000,
          deltaSavings: 0,
          deltaPortfolio: 0,
          whatChanged: 'Your daily available money dropped by ₹5,000; emergency savings stayed untouched.',
          whyItChanged: 'The repair was paid directly from your regular daily spending money.',
          whatGained: 'Your emergency savings number looks untouched on paper.',
          whatGaveUp: 'Leaves you with ₹5,000 less cash for groceries, utility bills, and everyday needs.',
          tradeoffAnalysis: {
            advantages: ['Emergency savings remains untouched on paper'],
            limitations: ['Daily cash drops sharply', 'Risk of running out of money before next payday']
          },
          principle: 'Using your daily spending money for big surprises can leave you unable to pay regular monthly bills.'
        },
        {
          id: 'A3',
          title: 'Sell Virtual Investments to Pay',
          summary: 'Sell ₹5,000 worth of your virtual investments to cover the repair.',
          deltaCash: 0,
          deltaSavings: 0,
          deltaPortfolio: -5000,
          whatChanged: 'Your virtual investments dropped by ₹5,000; cash and savings remained untouched.',
          whyItChanged: 'You cashed out long-term investments to pay a short-term bill.',
          whatGained: 'Cash and emergency savings stay unchanged today.',
          whatGaveUp: 'Stops ₹5,000 from growing over time; risks selling when prices are down.',
          tradeoffAnalysis: {
            advantages: ['Available cash and savings stay the same today'],
            limitations: ['Stops long-term growth', 'Might sell when market prices are low']
          },
          principle: 'Never treat long-term investments as an emergency fund. Frequent withdrawals hurt your long-term growth.'
        }
      ]
    },
    {
      id: 'EVENT_B',
      letter: 'B',
      title: 'You receive an additional ₹10,000',
      tag: 'Extra Income',
      amountINR: 10000,
      description: 'You received an additional ₹10,000 this month from a bonus or extra project.',
      investigation: {
        timeline: 'Extra money arrives starting with this month’s paycheck.',
        financialRisk: 'Lifestyle creep: spending extra money automatically without saving any of it.',
        constraints: 'This is extra money you can choose how to divide.',
        balanceContext: `Available Money: ₹${liquidCashINR.toLocaleString('en-IN')}; Emergency Savings: ₹${savingsINR.toLocaleString('en-IN')}.`
      },
      choices: [
        {
          id: 'B1',
          title: 'Balanced Split: 50% Savings / 50% Investments',
          summary: 'Put ₹5,000 into savings goals and invest ₹5,000 into your index fund.',
          deltaCash: 0,
          deltaSavings: 5000,
          deltaPortfolio: 5000,
          whatChanged: '₹5,000 went to emergency savings and ₹5,000 went into investments.',
          whyItChanged: 'You divided the bonus into savings and investments before spending it.',
          whatGained: 'Helps you build security and lets your investments grow over time.',
          whatGaveUp: 'Your daily leisure spending stays at the same level as before.',
          tradeoffAnalysis: {
            advantages: ['Reaches savings goals faster', 'Builds long-term wealth', 'Avoids lifestyle creep'],
            limitations: ['Extra spending money stays about the same']
          },
          principle: 'Pay yourself first. Saving at least half of every windfall before changing spending habits helps you build real security.'
        },
        {
          id: 'B2',
          title: 'Put 100% into Emergency Savings',
          summary: 'Add the entire ₹10,000 to strengthen your safety cushion.',
          deltaCash: 0,
          deltaSavings: 10000,
          deltaPortfolio: 0,
          whatChanged: 'Your emergency savings increased by ₹10,000.',
          whyItChanged: 'All the extra money went toward building peace of mind.',
          whatGained: 'Gives you more safety if you ever face an unexpected problem.',
          whatGaveUp: 'Less money growing in investments over the long term.',
          tradeoffAnalysis: {
            advantages: ['Quickly builds safety cushion', 'Maximum peace of mind'],
            limitations: ['Grows more slowly than investments over many years']
          },
          principle: 'Building emergency savings comes first if you have less than 3 months covered. Once safe, you can invest more.'
        },
        {
          id: 'B3',
          title: 'Spend It All on Upgrades and Fun',
          summary: 'Use the extra ₹10,000 for dining out, shopping, and subscriptions.',
          deltaCash: 10000,
          deltaSavings: 0,
          deltaPortfolio: 0,
          whatChanged: 'Your daily spending expanded by ₹10,000.',
          whyItChanged: 'The entire bonus was spent on lifestyle upgrades.',
          whatGained: 'Immediate fun and convenience right now.',
          whatGaveUp: 'Zero progress toward future security; gets you used to higher spending.',
          tradeoffAnalysis: {
            advantages: ['Fun and treats right now'],
            limitations: ['Zero savings gained', 'Harder to save in the future']
          },
          principle: 'Spending every raise keeps you on a treadmill where you work harder but never actually get ahead.'
        }
      ]
    },
    {
      id: 'EVENT_C',
      letter: 'C',
      title: 'You want to buy an expensive item',
      tag: 'Impulse Spending',
      amountINR: 12000,
      description: 'A 24-hour flash sale offers a gadget you like for ₹12,000. You are tempted to take money out of your emergency savings to buy it.',
      investigation: {
        timeline: 'Sale ends in 24 hours, creating pressure to decide quickly.',
        financialRisk: 'Using money set aside for emergencies on a luxury want.',
        constraints: 'The gadget is a want, not an urgent necessity like food, shelter, or medicine.',
        balanceContext: `Emergency Savings: ₹${emergencyINR.toLocaleString('en-IN')}; Available Money: ₹${liquidCashINR.toLocaleString('en-IN')}.`
      },
      choices: [
        {
          id: 'C1',
          title: 'Protect Your Savings: Skip the Sale',
          summary: 'Do not touch your emergency savings. Wait and save up for it later.',
          deltaCash: 0,
          deltaSavings: 0,
          deltaPortfolio: 0,
          whatChanged: 'All balances remain safely untouched; you skipped the impulse buy.',
          whyItChanged: 'You chose to keep emergency savings strictly for real emergencies.',
          whatGained: 'Your safety net stays 100% intact; you practiced self-discipline.',
          whatGaveUp: 'You miss the promotional discount today.',
          tradeoffAnalysis: {
            advantages: ['Safety net stays fully protected', 'Builds strong self-control', 'No financial regret later'],
            limitations: ['You miss the discount today']
          },
          principle: 'Emergency savings should only be used for true emergencies: medical issues, sudden job loss, or vital home repairs.'
        },
        {
          id: 'C2',
          title: 'Use Emergency Savings to Buy It',
          summary: 'Take ₹12,000 out of your savings cushion to buy the gadget today.',
          deltaCash: 0,
          deltaSavings: -12000,
          deltaPortfolio: 0,
          whatChanged: 'Emergency savings decreased by ₹12,000.',
          whyItChanged: 'Money meant for safety was spent on a shopping desire.',
          whatGained: 'You own the item today at a discounted price.',
          whatGaveUp: 'Leaves you vulnerable if a real emergency happens tomorrow.',
          tradeoffAnalysis: {
            advantages: ['You get the gadget right now on sale'],
            limitations: ['Leaves you unprotected for real surprises', 'Breaks savings habits']
          },
          principle: 'A discount on something you do not need is still money wasted. Never risk your safety net for a shopping deal.'
        },
        {
          id: 'C3',
          title: 'Create a Savings Goal and Save for It',
          summary: 'Set up a new goal in Savings Center and save ₹3,000/month for 4 months.',
          deltaCash: 0,
          deltaSavings: 0,
          deltaPortfolio: 0,
          whatChanged: 'A new savings plan is created without touching emergency savings.',
          whyItChanged: 'You plan to buy it from future income instead of emergency funds.',
          whatGained: 'You buy it guilt-free once saved, with zero risk to your safety.',
          whatGaveUp: 'You wait 4 months instead of buying it today.',
          tradeoffAnalysis: {
            advantages: ['Buy it guilt-free when ready', 'Emergency savings stays safe'],
            limitations: ['Requires patience and waiting 4 months']
          },
          principle: 'Goal-based saving turns impulse spending into planned achievements without hurting your financial safety.'
        }
      ]
    },
    {
      id: 'EVENT_D',
      letter: 'D',
      title: 'Your virtual investments lose value',
      tag: 'Price Drops',
      amountINR: 0,
      description: 'A market downturn caused virtual investment prices to drop by 18%. News headlines are alarming, and many people are selling in panic.',
      investigation: {
        timeline: 'The market drop started 2 weeks ago; prices are currently down.',
        financialRisk: 'Panic-selling turns temporary price drops into permanent losses.',
        constraints: 'Market prices go up and down in cycles; the underlying assets remain real and active.',
        balanceContext: `Available Money: ₹${liquidCashINR.toLocaleString('en-IN')}; Your Investments: ₹${portfolioINR.toLocaleString('en-IN')}.`
      },
      choices: [
        {
          id: 'D1',
          title: 'Stay Calm: Hold and Do Not Sell',
          summary: 'Keep your units. Give your investments time to recover over the cycle.',
          deltaCash: 0,
          deltaSavings: 0,
          deltaPortfolio: 0,
          whatChanged: 'You still own all your units; the dashboard simply shows lower prices today.',
          whyItChanged: 'You stuck to your long-term plan without reacting to short-term fear.',
          whatGained: 'You avoided turning paper drops into permanent cash losses; you stay in position for recovery.',
          whatGaveUp: 'Your portfolio value looks lower on screen right now.',
          tradeoffAnalysis: {
            advantages: ['Zero permanent losses realized', 'Ready to benefit when prices bounce back', 'Avoids panic mistakes'],
            limitations: ['You see lower numbers on screen temporarily']
          },
          principle: 'Ups and downs are normal when investing. Historically, patient investors who hold through downturns capture the full recovery.'
        },
        {
          id: 'D2',
          title: 'Buy More at a Discount',
          summary: 'Use ₹10,000 of extra cash to buy index units while prices are down.',
          deltaCash: -10000,
          deltaSavings: 0,
          deltaPortfolio: 10000,
          whatChanged: '₹10,000 cash was used to buy more units at lower prices.',
          whyItChanged: 'You used the price drop as a chance to buy quality assets on sale.',
          whatGained: 'Lowers your average cost per unit; increases future gains when prices recover.',
          whatGaveUp: 'Uses ₹10,000 of cash while prices are still fluctuating.',
          tradeoffAnalysis: {
            advantages: ['Buys investments at a discount', 'Speeds up future gains'],
            limitations: ['Uses cash during an uncertain time']
          },
          principle: 'Market drops can be buying opportunities. Buying more units when prices are lower builds greater long-term growth.'
        },
        {
          id: 'D3',
          title: 'Panic Sell Everything to Cash',
          summary: 'Sell all your investments immediately to prevent any further drops.',
          deltaCash: 0,
          deltaSavings: 0,
          deltaPortfolio: -18000,
          whatChanged: 'You sold all your units at low prices, locking in the 18% loss.',
          whyItChanged: 'Fear made you sell at the bottom of the market drop.',
          whatGained: 'Stops you from worrying about further short-term drops.',
          whatGaveUp: 'Locks in an 18% permanent loss and guarantees you miss the recovery.',
          tradeoffAnalysis: {
            advantages: ['Stops temporary worry today'],
            limitations: ['Permanently locks in the loss', 'Misses the future recovery']
          },
          principle: 'Panic selling during a downturn is the biggest reason investors lose money. Never sell long-term assets out of short-term fear.'
        }
      ]
    },
    {
      id: 'EVENT_E',
      letter: 'E',
      title: 'Build your savings: Target ₹30,000',
      tag: 'Savings Goal',
      amountINR: 30000,
      description: 'You set a goal to save ₹30,000 for an emergency reserve or planned purchase. Compare monthly savings amounts to see how long it takes.',
      investigation: {
        timeline: 'Choose a monthly savings amount and see how long it takes to reach your ₹30,000 target.',
        financialRisk: 'Choosing an unrealistic pace can cause budget burnout. Projections are estimates, not guarantees.',
        constraints: 'All projections are mathematical estimates based on steady monthly deposits.',
        balanceContext: `Available Money: ₹${liquidCashINR.toLocaleString('en-IN')}; Emergency Savings: ₹${savingsINR.toLocaleString('en-IN')}.`
      },
      choices: [
        {
          id: 'E1',
          title: 'Fast Pace: Save ₹10,000/month (3 Months)',
          summary: 'Save aggressively to reach your ₹30,000 goal in an estimated 3 months.',
          deltaCash: -10000,
          deltaSavings: 10000,
          deltaPortfolio: 0,
          whatChanged: '₹10,000 per month shifted into your savings goal.',
          whyItChanged: 'You chose a focused sprint to reach the target as fast as possible.',
          whatGained: 'Reaches your goal in an estimated 3 months, giving you security much sooner.',
          whatGaveUp: 'Requires strict spending cutbacks for 3 full months.',
          tradeoffAnalysis: {
            advantages: ['Reaches goal in an estimated 3 months', 'Fastest path to peace of mind'],
            limitations: ['Tight monthly spending room for 3 months']
          },
          principle: 'Short saving sprints work well for focused targets, provided your essential living expenses remain fully covered. Projections are estimates, not guarantees.'
        },
        {
          id: 'E2',
          title: 'Steady Pace: Save ₹5,000/month (6 Months)',
          summary: 'Save a moderate ₹5,000 each month to reach ₹30,000 in an estimated 6 months.',
          deltaCash: -5000,
          deltaSavings: 5000,
          deltaPortfolio: 0,
          whatChanged: '₹5,000 per month shifted into your savings goal.',
          whyItChanged: 'You chose a balanced pace that keeps your monthly budget relaxed.',
          whatGained: 'Comfortable daily living with zero stress while still making reliable progress.',
          whatGaveUp: 'Takes an estimated 6 months instead of 3 to reach the ₹30,000 goal.',
          tradeoffAnalysis: {
            advantages: ['Comfortable, low-stress budget', 'Easy habit to maintain long-term'],
            limitations: ['Takes 6 months to reach goal']
          },
          principle: 'Consistency beats intensity. Sustainable savings habits prevent burnout and build lasting wealth over years. Projections are estimates, not guarantees.'
        },
        {
          id: 'E3',
          title: 'Relaxed Pace: Save ₹2,500/month (12 Months)',
          summary: 'Save a light ₹2,500 each month to reach ₹30,000 in an estimated 12 months.',
          deltaCash: -2500,
          deltaSavings: 2500,
          deltaPortfolio: 0,
          whatChanged: '₹2,500 per month shifted into your savings goal.',
          whyItChanged: 'You prioritized maximum daily flexibility while still moving forward.',
          whatGained: 'Virtually no change to daily spending habits.',
          whatGaveUp: 'Takes a full year (12 months) to accumulate the ₹30,000 buffer.',
          tradeoffAnalysis: {
            advantages: ['Zero impact on day-to-day lifestyle', 'Very easy to stick with'],
            limitations: ['Takes 12 months to reach ₹30,000 cushion']
          },
          principle: 'Even small regular savings add up over time. Starting with what you can afford is always better than saving nothing. Projections are estimates, not guarantees.'
        }
      ]
    }
  ];

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const currentChoice = currentEvent.choices.find(c => c.id === selectedChoiceId) || currentEvent.choices[0];

  // Deterministic hypothetical calculations (Using identical starting snapshot)
  const simCash = Math.max(0, liquidCashINR + currentChoice.deltaCash);
  const simSavings = Math.max(0, savingsINR + currentChoice.deltaSavings);
  const simPortfolio = Math.max(0, portfolioINR + (currentChoice.deltaPortfolio || 0));
  const simTotalNetINR = simCash + simSavings + simPortfolio;
  const netDeltaTotal = simTotalNetINR - baselineTotalNetINR;

  const stepLabels = [
    { num: 1, label: 'What Happened' },
    { num: 2, label: 'Understand Situation' },
    { num: 3, label: 'Available Money' },
    { num: 4, label: 'Choose What to Do' },
    { num: 5, label: 'What Could Happen' },
    { num: 6, label: 'Compare Choices' },
    { num: 7, label: 'Financial Lesson' },
    { num: 8, label: 'Next Challenge' }
  ];

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setActiveStep(1);
    const ev = events.find(e => e.id === eventId);
    if (ev) setSelectedChoiceId(ev.choices[0].id);
  };

  const handleNextStep = () => {
    if (activeStep < 8) {
      setActiveStep(prev => prev + 1);
    } else {
      // Step 8 completed: notify and advance or close
      onCompleteEvent?.(currentEvent.id);
      const currentIndex = events.findIndex(e => e.id === selectedEventId);
      if (currentIndex < events.length - 1) {
        handleSelectEvent(events[currentIndex + 1].id);
      } else {
        onClose();
      }
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-canvas-white border border-edge rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-edge bg-canvas-subtle flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-copper/10 text-copper border border-copper/20 flex items-center justify-center font-serif font-bold text-lg">
              <Compass className="w-5 h-5 text-copper" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-base sm:text-lg font-bold text-ink">
                  Interactive Financial Events Simulator
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase font-mono">
                  Zero Real-Money Risk
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Hypothetical scenario lab • Real wallet & accounts remain 100% untouched.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
            aria-label="Close Events Simulator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Selector Ribbon */}
        <div className="px-5 sm:px-6 py-2.5 bg-canvas-white border-b border-edge flex items-center space-x-2 overflow-x-auto">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => handleSelectEvent(ev.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedEventId === ev.id
                  ? 'bg-forest text-canvas-white border-forest shadow-xs'
                  : 'bg-canvas-subtle text-ink-muted border-edge hover:text-ink'
              }`}
            >
              <span className="font-mono text-[10px] opacity-75 mr-1">EVENT {ev.letter}:</span>
              <span>{ev.title}</span>
            </button>
          ))}
        </div>

        {/* 8-Step Progress Sequencer Header */}
        <div className="px-5 sm:px-6 py-2 bg-canvas-subtle/60 border-b border-edge flex items-center justify-between text-xs overflow-x-auto">
          <div className="flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap">
            {stepLabels.map((st, idx) => {
              const isCurrent = activeStep === st.num;
              const isCompleted = activeStep > st.num;
              return (
                <React.Fragment key={st.num}>
                  <button
                    onClick={() => setActiveStep(st.num)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] transition ${
                      isCurrent
                        ? 'bg-forest text-canvas-white font-bold shadow-xs'
                        : isCompleted
                        ? 'text-forest font-semibold hover:bg-forest/10'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <span className="font-mono text-[10px]">{st.num}.</span>
                    <span>{st.label}</span>
                  </button>
                  {idx < stepLabels.length - 1 && (
                    <span className="text-edge-dark text-[10px]">›</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <span className="text-[11px] font-mono text-ink-subtle pl-2 hidden sm:inline">
            {currentEvent.tag}
          </span>
        </div>

        {/* Modal Body: Steps 1 to 8 */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: EVENT INTRODUCTION */}
          {activeStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-canvas-subtle border border-edge space-y-3">
                <div className="flex items-center space-x-2 text-copper font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Step 1 — Event Introduction</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-ink fade-up-stagger">
                  {currentEvent.title}
                </h3>
                <p className="text-sm text-ink leading-relaxed font-medium">
                  {currentEvent.description}
                </p>
                {currentEvent.amountINR > 0 && (
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-copper/10 border border-copper/20 text-copper font-mono text-xs font-bold">
                    <span>Capital Outlay / Cash Impact:</span>
                    <span>₹{currentEvent.amountINR.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-forest/5 border border-forest/20 text-xs text-ink-muted leading-relaxed">
                <strong className="text-forest">Strategic Objective: </strong>
                Investigate the parameters, review your starting account baseline, evaluate response strategies, and inspect deterministic consequences with zero real-account risk.
              </div>
            </div>
          )}

          {/* STEP 2: INVESTIGATE THE SITUATION */}
          {activeStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-forest uppercase tracking-wider font-mono">
                  Step 2 — Situation Deep-Dive
                </span>
                <h3 className="font-serif text-lg font-bold text-ink">
                  Investigate Scenario Constraints & Dynamics
                </h3>
                <p className="text-xs text-ink-muted">
                  Before choosing a response, analyze the timeline, risks, and institutional constraints.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5">
                  <span className="font-serif font-bold text-ink text-xs block">Execution Timeline:</span>
                  <p className="text-xs text-ink-muted leading-relaxed">{currentEvent.investigation.timeline}</p>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5">
                  <span className="font-serif font-bold text-copper text-xs block">Financial Vulnerability:</span>
                  <p className="text-xs text-ink-muted leading-relaxed">{currentEvent.investigation.financialRisk}</p>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5">
                  <span className="font-serif font-bold text-ink text-xs block">Operational Constraints:</span>
                  <p className="text-xs text-ink-muted leading-relaxed">{currentEvent.investigation.constraints}</p>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1.5">
                  <span className="font-serif font-bold text-forest text-xs block">Baseline Balance Context:</span>
                  <p className="text-xs text-ink-muted leading-relaxed">{currentEvent.investigation.balanceContext}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW AVAILABLE INFORMATION (STARTING SNAPSHOT) */}
          {activeStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-forest uppercase tracking-wider font-mono">
                    Step 3 — Available Information
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 font-mono">
                    Immutable Baseline
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-ink">
                  Starting Balance Sheet Snapshot
                </h3>
                <p className="text-xs text-ink-muted">
                  All strategic options below will be evaluated against this exact same starting position.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Available Cash</span>
                  <span className="font-mono text-base font-bold text-ink mt-1 block">
                    ₹{liquidCashINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-ink-subtle">Unencumbered daily cash</span>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Reserve Vault</span>
                  <span className="font-mono text-base font-bold text-forest mt-1 block">
                    ₹{savingsINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-ink-subtle">Protected defensive buffer</span>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Holdings Value</span>
                  <span className="font-mono text-base font-bold text-copper mt-1 block">
                    ₹{portfolioINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-ink-subtle">Compounding assets</span>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Net Capital</span>
                  <span className="font-mono text-base font-bold text-ink mt-1 block">
                    ₹{baselineTotalNetINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-ink-subtle">Total baseline equity</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-canvas-subtle border border-edge text-xs space-y-1">
                <span className="font-serif font-bold text-ink block">Deterministic Comparison Rule:</span>
                <p className="text-ink-muted leading-relaxed">
                  When you select a response strategy in the next step, the simulation calculates changes relative to this exact snapshot. Your real account balances remain 100% isolated and unchanged.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: CHOOSE A STRATEGY */}
          {activeStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-forest uppercase tracking-wider font-mono">
                  Step 4 — Choose Strategy
                </span>
                <h3 className="font-serif text-lg font-bold text-ink">
                  Select Your Financial Strategy
                </h3>
                <p className="text-xs text-ink-muted">
                  Choose one of three meaningful options. Each reflects authentic trade-offs rather than trivial right/wrong answers.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentEvent.choices.map((choice, idx) => {
                  const isSelected = selectedChoiceId === choice.id;

                  return (
                    <div
                      key={choice.id}
                      onClick={() => setSelectedChoiceId(choice.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-250 ease-out fade-up-stagger ${
                        isSelected
                          ? 'bg-canvas-white border-forest ring-2 ring-forest/30 shadow-md -translate-y-1'
                          : 'bg-canvas-subtle border-edge hover:border-forest/60 hover:bg-canvas-white hover:-translate-y-1 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase transition-colors duration-200 ${
                          isSelected ? 'bg-forest text-canvas-white' : 'bg-canvas-white text-ink-muted border border-edge'
                        }`}>
                          Strategy {choice.id}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-bold text-forest flex items-center gap-1 animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4" /> Selected
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-base font-bold text-ink mt-1.5">
                        {choice.title}
                      </h4>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                        {choice.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: CALCULATE CONSEQUENCES (BEFORE VS AFTER TABLE) */}
          {activeStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-canvas-white uppercase font-mono">
                    Step 5 — Deterministic Calculations
                  </span>
                  <span className="font-serif font-bold text-ink text-sm">
                    {currentChoice.title}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Simulated results calculated strictly against the baseline snapshot. Zero real account mutation.
                </p>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="overflow-hidden rounded-2xl border border-edge bg-canvas-subtle">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-edge bg-canvas-white/60 text-ink-muted text-[11px] font-serif uppercase tracking-wider">
                      <th className="p-3 text-left">Financial Metric</th>
                      <th className="p-3 text-right">Starting Snapshot</th>
                      <th className="p-3 text-right">Simulated Outcome</th>
                      <th className="p-3 text-right">Scenario Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge font-mono">
                    <tr className={currentChoice.deltaCash > 0 ? 'highlight-pos' : currentChoice.deltaCash < 0 ? 'highlight-neg' : ''}>
                      <td className="p-3 text-left font-sans font-semibold text-ink">Available Money</td>
                      <td className="p-3 text-right text-ink-muted">₹{liquidCashINR.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-ink">
                        <div>₹{simCash.toLocaleString('en-IN')}</div>
                        <div className="w-16 bg-edge/70 rounded-full h-1 overflow-hidden ml-auto mt-1">
                          <div 
                            className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(100, (simCash / (Math.max(1, liquidCashINR))) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className={`p-3 text-right font-bold ${currentChoice.deltaCash > 0 ? 'text-forest' : currentChoice.deltaCash < 0 ? 'text-neg' : 'text-ink-muted'}`}>
                        {currentChoice.deltaCash === 0 ? '₹0' : `${currentChoice.deltaCash > 0 ? '+' : ''}₹${currentChoice.deltaCash.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                    <tr className={currentChoice.deltaSavings > 0 ? 'highlight-pos' : currentChoice.deltaSavings < 0 ? 'highlight-neg' : ''}>
                      <td className="p-3 text-left font-sans font-semibold text-ink">Emergency Savings</td>
                      <td className="p-3 text-right text-ink-muted">₹{savingsINR.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-forest">
                        <div>₹{simSavings.toLocaleString('en-IN')}</div>
                        <div className="w-16 bg-edge/70 rounded-full h-1 overflow-hidden ml-auto mt-1">
                          <div 
                            className="h-full bg-forest rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(100, (simSavings / (Math.max(1, savingsINR))) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className={`p-3 text-right font-bold ${currentChoice.deltaSavings > 0 ? 'text-forest' : currentChoice.deltaSavings < 0 ? 'text-neg' : 'text-ink-muted'}`}>
                        {currentChoice.deltaSavings === 0 ? '₹0' : `${currentChoice.deltaSavings > 0 ? '+' : ''}₹${currentChoice.deltaSavings.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                    <tr className={(currentChoice.deltaPortfolio || 0) > 0 ? 'highlight-pos' : (currentChoice.deltaPortfolio || 0) < 0 ? 'highlight-neg' : ''}>
                      <td className="p-3 text-left font-sans font-semibold text-ink">Your Investments</td>
                      <td className="p-3 text-right text-ink-muted">₹{portfolioINR.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-copper">
                        <div>₹{simPortfolio.toLocaleString('en-IN')}</div>
                        <div className="w-16 bg-edge/70 rounded-full h-1 overflow-hidden ml-auto mt-1">
                          <div 
                            className="h-full bg-copper rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${portfolioINR > 0 ? Math.min(100, (simPortfolio / portfolioINR) * 100) : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className={`p-3 text-right font-bold ${(currentChoice.deltaPortfolio || 0) > 0 ? 'text-forest' : (currentChoice.deltaPortfolio || 0) < 0 ? 'text-neg' : 'text-ink-muted'}`}>
                        {(currentChoice.deltaPortfolio || 0) === 0 ? '₹0' : `${(currentChoice.deltaPortfolio || 0) > 0 ? '+' : ''}₹${(currentChoice.deltaPortfolio || 0).toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                    <tr className="bg-canvas-white/40 font-bold">
                      <td className="p-3 text-left font-sans text-ink">Total Money & Investments</td>
                      <td className="p-3 text-right text-ink-muted">₹{baselineTotalNetINR.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-forest">₹{simTotalNetINR.toLocaleString('en-IN')}</td>
                      <td className={`p-3 text-right ${netDeltaTotal >= 0 ? 'text-forest' : 'text-neg'}`}>
                        {netDeltaTotal === 0 ? '₹0' : `${netDeltaTotal > 0 ? '+' : ''}₹${netDeltaTotal.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* What Changed & Why */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                  <span className="font-serif font-bold text-ink block">What Changed:</span>
                  <p className="text-ink-muted leading-relaxed">{currentChoice.whatChanged}</p>
                </div>
                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                  <span className="font-serif font-bold text-forest block">Why It Changed:</span>
                  <p className="text-ink-muted leading-relaxed">{currentChoice.whyItChanged}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: EXPLAIN TRADE-OFFS */}
          {activeStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-forest uppercase tracking-wider font-mono">
                  Step 6 — Strategic Trade-Offs
                </span>
                <h3 className="font-serif text-lg font-bold text-ink">
                  Evaluate What You Gained vs. What You Gave Up
                </h3>
                <p className="text-xs text-ink-muted">
                  Every financial decision involves an opportunity cost. Understanding both sides prevents unforced errors.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-2xl bg-canvas-subtle border border-forest/30 space-y-3">
                  <div className="flex items-center space-x-2 text-forest font-bold uppercase text-[11px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>What You Gained (Strategic Advantages):</span>
                  </div>
                  <p className="text-ink font-medium leading-relaxed">
                    {currentChoice.whatGained}
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside text-ink-muted pt-2 border-t border-edge">
                    {currentChoice.tradeoffAnalysis.advantages.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-canvas-subtle border border-copper/30 space-y-3">
                  <div className="flex items-center space-x-2 text-copper font-bold uppercase text-[11px]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>What You Gave Up (Trade-Offs & Costs):</span>
                  </div>
                  <p className="text-ink font-medium leading-relaxed">
                    {currentChoice.whatGaveUp}
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside text-ink-muted pt-2 border-t border-edge">
                    {currentChoice.tradeoffAnalysis.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: TEACH THE FINANCIAL PRINCIPLE */}
          {activeStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-forest/10 border border-forest/30 space-y-3 fade-up-stagger">
                <div className="flex items-center space-x-2 text-forest font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Step 7 — Core Financial Principle</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-ink">
                  The Principle Behind This Scenario
                </h3>
                <p className="text-sm text-ink leading-relaxed font-medium">
                  {currentChoice.principle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                  <strong className="text-forest block">Strategic Mental Model:</strong>
                  <p className="text-ink-muted leading-relaxed">
                    Financial decisions should align with liquidity buckets: short-term obligations from checking, emergency shocks from reserve vaults, and multi-year goals from compounding assets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-1">
                  <strong className="text-copper block">Defensive Discipline:</strong>
                  <p className="text-ink-muted leading-relaxed">
                    Surplus is easiest to allocate immediately upon receipt before hedonic adaptation turns luxury windfalls into baseline expectations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: CHALLENGE COMPLETE RESULT SCREEN */}
          {activeStep === 8 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-canvas-subtle border border-edge space-y-4">
                <div className="flex items-center space-x-2 text-forest font-bold text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>CHALLENGE COMPLETE</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-ink">
                  You compared three ways to handle this situation.
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  You successfully tested <strong className="text-ink">{currentEvent.title}</strong> using Option <strong className="text-ink">{currentChoice.id}: {currentChoice.title}</strong>.
                </p>

                <div className="p-4 rounded-xl bg-forest/10 border border-forest/30 text-xs space-y-1.5">
                  <span className="font-bold text-forest uppercase tracking-wider text-[10px] block">
                    WHAT YOU LEARNED
                  </span>
                  <p className="text-ink leading-relaxed font-medium">
                    {currentChoice.principle}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-canvas-white border border-edge text-xs space-y-2">
                  <span className="font-bold text-ink uppercase tracking-wider text-[10px] block">
                    YOUR PROGRESS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-ink-muted block text-[11px]">Real Money Safety:</span>
                      <span className="font-mono font-bold text-forest">100% Protected (Zero Real Balance Impact)</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block text-[11px]">Challenge Completed:</span>
                      <span className="font-mono font-bold text-forest">{currentEvent.letter} • {currentEvent.tag}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-canvas-white hover:bg-canvas-subtle text-ink border border-edge text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay This Challenge</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
                  >
                    <span>Continue to Next Challenge</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-edge bg-canvas-subtle flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={activeStep === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-30 transition"
          >
            ← Previous Step
          </button>

          <div className="flex items-center space-x-3">
            {activeStep >= 5 && activeStep < 8 && (
              <button
                onClick={() => setActiveStep(4)}
                className="px-3.5 py-2 rounded-xl bg-canvas-white hover:bg-canvas-subtle text-ink border border-edge text-xs font-semibold transition hidden sm:inline"
              >
                Change Strategy
              </button>
            )}

            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <span>
                {activeStep === 1 ? 'Investigate Situation' :
                 activeStep === 2 ? 'Review Information' :
                 activeStep === 3 ? 'Choose Strategy' :
                 activeStep === 4 ? 'Calculate Consequences' :
                 activeStep === 5 ? 'Explain Trade-Offs' :
                 activeStep === 6 ? 'View Principle' :
                 activeStep === 7 ? 'Scenario Summary' : 'Complete & Continue'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
