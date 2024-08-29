import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import defaultEmotion from '../assets/emotion/neutralemoji.png';
interface EmotionCardProps {
    emotionImage: string | null;
}

export default function EmotionCard(props: EmotionCardProps) {

    return (
        <Card elevation={10} sx={{ display: 'flex', alignItems: 'center', borderRadius: '30px' }}>
            <CardMedia
                component="img"
                sx={{ height: '10vh', width: 'auto', objectFit: 'contain' }}
                src={props.emotionImage || defaultEmotion}
                alt="Emotion Image"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: '1 0 auto', padding: '8px !important' }}>
                    <Typography component="div" variant="subtitle1">
                        Lately, has been feeling
                    </Typography>
                    <Typography variant="h6" component="div">
                        Sample Emotion
                    </Typography>
                </CardContent>
            </Box>
        </Card>
    );
}