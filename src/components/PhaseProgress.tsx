import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { Gauge, gaugeClasses } from '@mui/x-charts';
import { convertMillisecondsToReadableString, PhasePromptMap, SessionPromptMap, StudentCard } from '../functions/query';
import { Timestamp } from 'firebase/firestore';

type PhaseProgressProps = {
    phasesPromptData: PhasePromptMap | null;
    studentCards: Map<string, StudentCard>;
}

const phaseNewColors = [{ bg: '#b6dd8d', text: '#2a3716' }, { bg: '#f4b3ff', text: '#4f0341' }, { bg: '#94ddff', text: '#0e3677' }, { bg: '#fdacaa', text: '#4b0606' }];

export default function PhaseProgress({ phasesPromptData, studentCards }: PhaseProgressProps) {
    return (
        phasesPromptData && Array.from(phasesPromptData.entries()).map(([key, data]) => {
            const currentPhase = key;
            const currentPhaseCards = studentCards ?
                Array.from(studentCards.entries()).filter(([_, card]) => {
                    switch (currentPhase) {
                        case '2':
                            // Include cards that are not in the 'Emotions' category for phase 2
                            return card.category !== 'Emotions';
                        case '3':
                            // Include cards that are in the 'Emotions' category for phase 3
                            return card.category === 'Emotions';
                        default:
                            // Include all cards by default
                            return true;
                    }
                }) : [];
            const currentPhaseCardsLength = currentPhaseCards.length;
            const currentPhaseIndependentCardsLength = currentPhaseCards.filter(([_, card]) => {
                switch (currentPhase) {
                    case '1':
                        return card.phase1_independence === true;
                    case '2':
                        return card.phase2_independence === true;
                    case '3':
                        return card.phase3_independence === true;
                    default:
                        console.error('Invalid phase');
                        return false;
                }
            }).length;

            const independentCardsTimestamp = new Map<string, { firstInstance: Timestamp, completion: Timestamp }>();

            data.session.forEach((sessionPrompt) => {
                sessionPrompt.trialPrompt.forEach((trialPrompt) => {
                    const { cardID, timestamp } = trialPrompt;
                    const existingInstance = independentCardsTimestamp.get(cardID);
                    let completionTimestamp: Timestamp | undefined = undefined;
                    switch (currentPhase) {
                        case '1':
                            completionTimestamp = studentCards.get(cardID)?.phase1_completion;
                            break;
                        case '2':
                            completionTimestamp = studentCards.get(cardID)?.phase2_completion;
                            break;
                        case '3':
                            completionTimestamp = studentCards.get(cardID)?.phase3_completion;
                            break;
                        default:
                            break;
                    }

                    if (completionTimestamp) {
                        if (existingInstance) {
                            if (timestamp.toMillis() < existingInstance.firstInstance.toMillis()) {
                                existingInstance.firstInstance = timestamp;
                            }
                            if (timestamp.toMillis() > existingInstance.completion.toMillis()) {
                                existingInstance.completion = timestamp;
                            }
                        } else {
                            independentCardsTimestamp.set(cardID, { firstInstance: timestamp, completion: completionTimestamp });
                        }
                    }
                });
            });
            // console.table(independentCardsTimestamp)

            const averageSingleCardIndependenceTime = Array.from(independentCardsTimestamp.values()).reduce((sum, instance) => {
                const timeDifference = instance.completion.toMillis() - instance.firstInstance.toMillis();
                return sum + timeDifference;
            }, 0) / independentCardsTimestamp.size;

            const estimatedTimeOfPhaseCompletion = (() => {
                // Extract all completion times with their differences
                const completionTimes = Array.from(independentCardsTimestamp.values())
                    .map(instance => instance.completion.toMillis() - instance.firstInstance.toMillis());

                // Sort completion times in descending order (most recent first)
                const mostRecentCompletionTimes = completionTimes.sort((a, b) => b - a).slice(0, 5);

                // Calculate the average of the 5 most recent completion times
                const averageRecentIndependenceTime = mostRecentCompletionTimes.reduce((sum, time) => sum + time, 0) / mostRecentCompletionTimes.length;

                // Calculate the estimated time to complete the phase
                const remainingCards = currentPhaseCardsLength - currentPhaseIndependentCardsLength;
                return remainingCards * averageRecentIndependenceTime;
            })();

            return (
                <Card
                    elevation={4}
                    sx={{
                        p: 1,
                        boxSizing: 'border-box',
                        flex: '1 1 25%',
                        minWidth: 'calc(90% / 4)',
                        maxWidth: 'calc(100% / 4)',
                    }}
                    key={key}
                >
                    <Typography variant='h4' component='h4' my={2} mx={2}>{`Phase ${key} Progress`}</Typography>
                    <MuiGauge value={currentPhaseIndependentCardsLength / currentPhaseCardsLength * 100} fill={phaseNewColors[parseInt(currentPhase) - 1].bg} />

                    <Typography variant='subtitle1' mt={4} mx={2}>Proficient cards: <strong>{currentPhaseIndependentCardsLength}</strong></Typography>
                    <Typography variant='subtitle1' mx={2}>Total cards: <strong>{currentPhaseCardsLength}</strong></Typography>
                    <Typography variant='subtitle1' mx={2}>Average time for single card independence: <strong style={{ wordWrap: 'break-word' }}>{convertMillisecondsToReadableString(averageSingleCardIndependenceTime)}</strong></Typography>
                    <Typography variant='subtitle1' mx={2}>Estimated time of phase completion: <strong style={{ wordWrap: 'break-word' }}>{convertMillisecondsToReadableString(estimatedTimeOfPhaseCompletion)}</strong></Typography>
                </Card>
            );
        }));
}

export function MuiGauge({ value, fill }: { value: number, fill: string }) {
    return (
        <Gauge
            value={value}
            startAngle={0}
            endAngle={360}
            innerRadius="80%"
            outerRadius="100%"
            height={200}
            sx={{
                [`& .${gaugeClasses.valueText}`]: {
                    fontFamily: 'Roboto',
                    fontSize: '1.5em',
                    fontWeight: 500,
                },
                [`& .${gaugeClasses.valueArc}`]: {
                    fill: fill,
                },
            }}
            text={
                ({ value }) => `${value?.toFixed(2).replace(/\.00$/, '')}%`
            }
        />
    )
}
