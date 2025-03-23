import { Avatar, Badge, Tooltip } from '@mui/material';
import physicalPrompt from '../assets/prompts/prompt_icon_0.png';
import modelingPrompt from '../assets/prompts/prompt_icon_1.png';
import gesturalPrompt from '../assets/prompts/prompt_icon_2.png';
import verbalPrompt from '../assets/prompts/prompt_icon_3.png';
import independentPrompt from '../assets/prompts/prompt_icon_4.png';

interface StudentPromptProps {
    studentPrompts: {
        email?: string,
        gestural?: number,
        independent?: number,
        modeling?: number,
        physical?: number,
        verbal?: number,
    }
}

export default function StudentPrompt({ studentPrompts }: StudentPromptProps) {
    return (
        <>
            <Tooltip title={<h2 style={{ color: "White" }}>Physical Prompt</h2>}
                followCursor
            >
                <Badge badgeContent={studentPrompts.physical || 0} color="primary">
                    <Avatar
                        alt="Physical Prompt"
                        src={physicalPrompt}
                        sx={{
                            mx: '10px',
                            height: 'auto',
                            width: 'auto',
                        }}>
                    </Avatar>
                </Badge>
            </Tooltip>

            <Tooltip title={<h2 style={{ color: "White" }}>Verbal Prompt</h2>}
                followCursor
            >
                <Badge badgeContent={studentPrompts.verbal || 0} color="primary">
                    <Avatar
                        alt="Verbal Prompt"
                        src={verbalPrompt}
                        sx={{
                            mx: '10px',
                            height: 'auto',
                            width: 'auto',
                        }}>
                    </Avatar>
                </Badge>
            </Tooltip>

            <Tooltip title={<h2 style={{ color: "White" }}>Gestural Prompt</h2>}
                followCursor
            >
                <Badge badgeContent={studentPrompts.gestural || 0} color="primary">
                    <Avatar
                        alt="Gestural Prompt"
                        src={gesturalPrompt}
                        sx={{
                            mx: '10px',
                            height: 'auto',
                            width: 'auto',
                        }}>
                    </Avatar>
                </Badge>
            </Tooltip>

            <Tooltip title={<h2 style={{ color: "White" }}>Modeling Prompt</h2>}
                followCursor
            >
                <Badge badgeContent={studentPrompts.modeling || 0} color="primary">
                    <Avatar
                        alt="Modeling Prompt"
                        src={modelingPrompt}
                        sx={{
                            mx: '10px',
                            height: 'auto',
                            width: 'auto',
                        }}>
                    </Avatar>
                </Badge>
            </Tooltip>

            <Tooltip title={<h2 style={{ color: "White" }}>Independent Prompt</h2>}
                followCursor
            >
                <Badge badgeContent={studentPrompts.independent || 0} color="primary">
                    <Avatar
                        alt="Independent Prompt"
                        src={independentPrompt}
                        sx={{
                            mx: '10px',
                            height: 'auto',
                            width: 'auto',
                        }}>
                    </Avatar>
                </Badge>
            </Tooltip>


        </>
    )
}
