import { Gauge } from '@mui/x-charts';

export default function MuiGauge({ value }: { value: number }) {
    return (
        <Gauge
            value={value}
            startAngle={0}
            endAngle={360}
            innerRadius="80%"
            outerRadius="100%"
            height={200}
        />
    )
}
