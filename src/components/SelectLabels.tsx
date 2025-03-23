import { ReactNode } from 'react';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface SelectLabelsProps {
    label: string;
    ranking: string;
    handleChange: (event: SelectChangeEvent) => void;
    children: ReactNode;
}


export default function SelectLabels({ label, ranking, handleChange, children }: SelectLabelsProps) {
    return (
        <div>
            <FormControl sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="demo-simple-select-helper-label">{label}</InputLabel>
                <Select
                    labelId="demo-simple-select-helper-label"
                    id="demo-simple-select-helper"
                    value={ranking}
                    label={label}
                    onChange={handleChange}
                >
                    {/* <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Ten</MenuItem>
                    <MenuItem value={20}>Twenty</MenuItem>
                    <MenuItem value={30}>Thirty</MenuItem> */}
                    {children}
                </Select>

            </FormControl>
        </div>
    );
}