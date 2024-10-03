import { Typography } from "@mui/material";
import useAuth from "../hooks/useAuth"

export default function AdminHome() {
  const { currentUserName } = useAuth();
  return (
    <>
      <Typography variant="h4" component="h4">
        Welcome {currentUserName}
      </Typography >
    </>
  )
}