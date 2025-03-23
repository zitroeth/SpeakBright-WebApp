import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Timestamp } from 'firebase/firestore';
import { removeGuardian } from '../functions/query';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import useAuth from '../hooks/useAuth';

interface Guardian {
    userID: string;
    name: string;
    email: string;
    birthday: Timestamp;
}

interface GuardianTableProps {
    guardians: Guardian[];
}

export default function GuardianTable({ guardians }: GuardianTableProps) {
    const { currentUser } = useAuth();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deleteGuardianModal, setDeleteGuardianModal] = useState({
        isActive: false,
        guardianId: '',
        guardianName: '',
    });

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    async function handleDeleteGuardian(guardianId: string) {
        try {
            await removeGuardian(currentUser?.uid as string, guardianId)
            alert(`Guardian: ${deleteGuardianModal.guardianName} has been removed successfully!`);
            location.reload();
        } catch (error) {
            alert(error);
        } finally {
            setDeleteGuardianModal({ isActive: false, guardianId: '', guardianName: '' });
        }
    }

    return (
        <Box sx={{
            mt: 1,
            mr: 10,
            mb: 10,
            ml: 10,
        }}>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Guardian ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Birthday</TableCell>
                                <TableCell>Students</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {guardians
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((guardian) => (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={guardian.userID}>
                                        <TableCell>{guardian.userID}</TableCell>
                                        <TableCell>{guardian.name}</TableCell>
                                        <TableCell>{guardian.email}</TableCell>
                                        <TableCell>{guardian.birthday.toDate().toDateString()}</TableCell>
                                        <TableCell>
                                            <IconButton aria-label="student-table-view-icon-button" href={`/Home/Admin/${guardian.userID}`}>
                                                <TableViewIcon />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton aria-label="guardian-delete-forever-icon-button" color='error'
                                                onClick={() => setDeleteGuardianModal({ isActive: true, guardianId: guardian.userID, guardianName: guardian.name })}>
                                                <DeleteForeverIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={guardians.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            <Dialog
                open={deleteGuardianModal.isActive}
                onClose={() => setDeleteGuardianModal({ isActive: false, guardianId: '', guardianName: '' })}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <b>{`Delete Guardian: ${deleteGuardianModal.guardianName}`}</b>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete guardian? This action can not be reversed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteGuardianModal({ isActive: false, guardianId: '', guardianName: '' })} sx={{ backgroundColor: "#c1c1c1" }} variant="contained">Cancel</Button>
                    <Button onClick={() => handleDeleteGuardian(deleteGuardianModal.guardianId)} autoFocus color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
