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
import { removeStudent } from '../functions/query';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useParams } from 'react-router-dom';
import AdminViewCardModal from './AdminViewCardModal';

interface Student {
    userID: string;
    name: string;
    email: string;
    birthday: Timestamp;
}

interface StudentTableProps {
    students: Student[];
}

export default function StudentTable({ students }: StudentTableProps) {
    const { guardianId } = useParams();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deleteStudentModal, setDeleteStudentModal] = useState({
        isActive: false,
        studentId: '',
        studentName: '',
    });
    const [openAdminViewCardModal, setOpenAdminViewCardModal] = useState(false);
    const [modalStudentId, setModalStudentId] = useState("");

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    async function handleDeleteStudent(studentId: string) {
        try {
            await removeStudent(guardianId as string, studentId)
            alert(`Student: ${deleteStudentModal.studentName} has been removed successfully!`);
        } catch (error) {
            alert(error);
        } finally {
            setDeleteStudentModal({ isActive: false, studentId: '', studentName: '' });
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
                                <TableCell>Student ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Birthday</TableCell>
                                <TableCell>Cards</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((student) => (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={student.userID}>
                                        <TableCell>{student.userID}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>{student.birthday.toDate().toDateString()}</TableCell>
                                        <TableCell>
                                            <IconButton aria-label="student-table-view-icon-button" onClick={() => { setOpenAdminViewCardModal(true); setModalStudentId(student.userID) }}>
                                                <PhotoLibraryIcon />
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton aria-label="student-delete-forever-icon-button" color='error'
                                                onClick={() => setDeleteStudentModal({ isActive: true, studentId: student.userID, studentName: student.name })}>
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
                    count={students.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            <Dialog
                open={deleteStudentModal.isActive}
                onClose={() => setDeleteStudentModal({ isActive: false, studentId: '', studentName: '' })}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <b>{`Delete Student: ${deleteStudentModal.studentName}`}</b>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete student? This action can not be reversed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteStudentModal({ isActive: false, studentId: '', studentName: '' })} sx={{ backgroundColor: "#c1c1c1" }} variant="contained">Cancel</Button>
                    <Button onClick={() => handleDeleteStudent(deleteStudentModal.studentId)} autoFocus color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            <AdminViewCardModal open={openAdminViewCardModal} handleClose={() => setOpenAdminViewCardModal(false)} studentId={modalStudentId} />
        </Box>
    );
}
