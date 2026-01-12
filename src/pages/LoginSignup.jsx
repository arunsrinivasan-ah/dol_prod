import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Link,
  InputAdornment,
} from "@mui/material";
import { useState } from "react";
import { loginApi } from "../api/apiAuth";
import waveImg from "../assets/images/wave.png";
import dolphinImg from "../assets/images/dolphin_login.png";
import abstractBg from "../assets/images/abstract-login.png";
import dolphinBlack from "../assets/images/dolphin_b.png";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import HttpsIcon from "@mui/icons-material/Https";
import raindropImg from "../assets/images/Rain_drop.png";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email address";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const userId = await loginApi(email, password);
      onLoginSuccess(userId);
    } catch (error) {
      setErrors({ form: error.message });
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        bgcolor: "#fff",
        overflow: "hidden",
        backgroundImage: `url(${abstractBg})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "100% 100%",
      }}
    >
      <Box
        sx={{
          width: "50%",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "start",
          position: "relative",
        }}
      >
        <Box
          sx={{ display: "flex", gap: 1.5, alignItems: "center", ml: 3, mt: 3 }}
        >
          <Box
            component="img"
            src={dolphinBlack}
            alt="dolphin"
            sx={{
              width: 80,
              height: 80,
            }}
          />
          <Typography variant="h4" fontWeight={700} color="#0b5fa5">
            Dolphin | AI
          </Typography>
        </Box>

        <Typography
          variant="h3"
          fontWeight={800}
          color="#0b5fa5"
          sx={{ ml: 3 }}
        >
          Your digital
          <br />
          shipmate –
        </Typography>

        <Typography variant="h6" color="#1b6fae" sx={{ ml: 3 }}>
          Intelligent guidance,
          <br />
          anytime, anywhere
        </Typography>

        <Box
          sx={{
            position: "absolute",
            bottom: "-100px",
            left: "-12%",
            width: "100%",
            height: "260px",
            pointerEvents: "none",
            zIndex: 1,
            transform: "rotate(20deg)",
          }}
        >
          
          <Box
            component="img"
            src={dolphinImg}
            alt="dolphin"
            sx={{
              position: "absolute",
              width: 300,
              left: 0,
              bottom: 0,
            }}
          />

         
          <Box
            component="img"
            src={dolphinImg}
            alt="dolphin"
            sx={{
              position: "absolute",
              width: 160,
              left: 90,
              bottom: 20,
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "50%",
          position: "relative",
        }}
      >
        <Paper
          sx={{
            width: 400,
            px: 5,
            pt: 5, 
            pb: 1,
            borderRadius: 4,
            border: "1.5px solid var(--marine-blue2)",
            position: "relative",
            zIndex: 2,
            marginBottom: "15%",
            overflow: "visible", 
          }}
        >

          <Box
            component="img"
            src={raindropImg}
            alt="raindrop"
            sx={{
              position: "absolute",
              top: -100, 
              left: -95,
              width: 200,
              pointerEvents: "none",
              zIndex: 3,
            }}
          />

          <Typography
            variant="h5"
            fontWeight={700}
            mb={1}
            color="var(--marine-blue2)"
          >
            SIGN IN
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={1.5}
            fontWeight={500}
          >
            Sign in to continue your smart conversations with our AI-powered
            chatbot.
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontSize: "15px", color: "#261046" }}
                >
                  Email
                </Typography>
                <TextField
                  placeholder="Enter your email"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    height: 45,
                    "& .MuiInputBase-root": { height: 45 },
                    "& input": { padding: "10px 12px", fontSize: 14 },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalPostOfficeIcon
                            sx={{ color: "var(--placeholder)" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography
                  variant="h1"
                  sx={{ fontWeight: 600, fontSize: 15, color: "#261046" }}
                >
                  Password
                </Typography>
                <TextField
                  placeholder="Enter your password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  sx={{
                    height: 45,
                    "& .MuiInputBase-root": { height: 45 },
                    "& input": { padding: "10px 12px", fontSize: 14 },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <HttpsIcon sx={{ color: "var(--placeholder)" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Stack>

            <Box textAlign="right" my={1}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 600 }}
                color="var(--marine-blue2)"
              >
                Forgot Password ?
              </Typography>
            </Box>

            {errors.form && (
              <Typography color="error" textAlign="center">
                {errors.form}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                bgcolor: "#0b5fa5",
                py: 0.5,
                borderRadius: 2,
                mb: 1,
                fontSize: 12,
              }}
            >
              SIGN IN
            </Button>

            <Typography
              variant="caption"
              textAlign="center"
              color="text.secondary"
              mb={1}
              fontWeight={600}
            >
              CONTACT HELP DESK
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "var(--muted)",
                textAlign: "center",
                fontSize: 10,
              }}
            >
              © 2025 Mariner Skills , LLC. All rights reserved
            </Typography>
          </Box>
        </Paper>
      </Box>


      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "200px", 
          overflow: "hidden",
          pointerEvents: "none", 
          zIndex: 0,
        }}
      >
        <Box
          component="img"
          src={waveImg}
          alt="wave"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>
    </Box>
  );
}
