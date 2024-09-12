// import Box from '@mui/material/Box';
// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
// import CardMedia from '@mui/material/CardMedia';
// import Typography from '@mui/material/Typography';
// import defaultEmotion from '../assets/emotion/neutralemoji.png';
// import angerEmotion from '../assets/emotion/angeremoji.png';
// import anticipationdefaultEmotion from '../assets/emotion/anticipationemoji.png';
// import disgustEmotion from '../assets/emotion/disgustemoji.png';
// import fearEmotion from '../assets/emotion/fearemoji.png';
// import joyEmotion from '../assets/emotion/joyemoji.png';
// import negativeEmotion from '../assets/emotion/negativeemoji.png';
// import positiveEmotion from '../assets/emotion/positiveemoji.png';
// import sadnessEmotion from '../assets/emotion/sadnessemoji.png';
// import supriseEmotion from '../assets/emotion/supriseemoji.png';
// import trustEmotion from '../assets/emotion/trustemoji.png';

// // ${ props.emotionTitle.toLowerCase() }
// interface EmotionCardProps {
//     emotionTitle: string | null;
// }
// export default function EmotionCard(props: EmotionCardProps | null) {


//     return (
//         <Card elevation={10} sx={{ display: 'flex', alignItems: 'center', borderRadius: '30px' }}>
//             <CardMedia
//                 component="img"
//                 sx={{ height: '10vh', width: 'auto', objectFit: 'contain' }}
//                 src={`${props.emotionTitle.toLowerCase()}`=== anger : angerEmotion ?

//                 }
//                 alt="Emotion Image"
//             />
//             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//                 <CardContent sx={{ flex: '1 0 auto', padding: '8px !important' }}>
//                     <Typography component="div" variant="subtitle1">
//                         Lately, has been feeling
//                     </Typography>
//                     <Typography variant="h6" component="div">
//                         {props?.emotionTitle}
//                     </Typography>
//                 </CardContent>
//             </Box>
//         </Card>
//     );
// }
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
import negativeEmotion from '../assets/emotion/negativeemoji.png';
import positiveEmotion from '../assets/emotion/positiveemoji.png';
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
        negative: negativeEmotion,
        positive: positiveEmotion,
        sadness: sadnessEmotion,
        surprise: surpriseEmotion,
        trust: trustEmotion,
    };

    // Get the corresponding image or use the default if the emotion is not in the map
    const emotionImage = props?.emotions.length !== 0
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
                        {props?.emotions.length !== 0 ? 'Lately, has been feeling' : 'No emotion detected'}
                    </Typography>
                    <Typography variant="h6" component="div">
                        {props?.emotions.length !== 0 ? props.emotions.join(', ') : 'No emotion detected'}
                    </Typography>
                </CardContent>
            </Box>
        </Card>
    );
}