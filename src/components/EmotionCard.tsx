import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import defaultEmotion from '../assets/emotion/neutralemoji.png';
import angerEmotion from '../assets/emotion/angeremoji.png';
import anticipationEmotion from '../assets/emotion/anticipationemoji.png';
import disgustEmotion from '../assets/emotion/disgustemoji.png';
import fearEmotion from '../assets/emotion/fearemoji.png';
import joyEmotion from '../assets/emotion/joyemoji.png';
import sadnessEmotion from '../assets/emotion/sadnessemoji.png';
import surpriseEmotion from '../assets/emotion/supriseemoji.png';
import trustEmotion from '../assets/emotion/trustemoji.png';

interface EmotionCardProps {
    emotions: string[] | null;
}

export default function EmotionCard(props: EmotionCardProps) {
    // Map each emotion to its corresponding image
    const emotionImages: { [key: string]: string } = {
        anger: angerEmotion,
        anticipation: anticipationEmotion,
        disgust: disgustEmotion,
        fear: fearEmotion,
        joy: joyEmotion,
        sadness: sadnessEmotion,
        surprise: surpriseEmotion,
        trust: trustEmotion,
    };

    // Get the corresponding image or use the default if the emotion is not in the map
    const emotionImage = props?.emotions?.length !== 0
        ? emotionImages[props.emotions[0].toLowerCase()] || defaultEmotion
        : defaultEmotion;

    return (
        <Card elevation={10} sx={{ display: 'flex', alignItems: 'center', borderRadius: '30px' }}>
            <CardMedia
                component="img"
                sx={{ height: '10vh', width: 'auto', objectFit: 'contain' }}
                src={emotionImage}
                alt="Emotion Image"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: '1 0 auto', padding: '8px !important' }}>
                    <Typography component="div" variant="subtitle1">
                        {props?.emotions?.length !== 0 ? 'Lately, has been feeling' : 'No emotion detected'}
                    </Typography>
                    <Typography variant="h6" component="div">
                        {props?.emotions?.length !== 0 ? props.emotions?.join(', ') : 'No emotion detected'}
                    </Typography>
                </CardContent>
            </Box>
        </Card>
    );
}