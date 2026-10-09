# Ransomware Detection & File Protection System

RansomGuard is a web application that helps users identify suspicious file indicators and complete tasks to reduce ransomware risk. Users can register, sign in, upload files for safe analysis, review file-check results, and track assigned prevention work. Administrators manage user access, review risky-file reports, assign tasks, approve completed work, and inspect database tables through a secure read-only console.

The system uses a React frontend, a Spring Boot backend, and a MySQL database. JWT authentication and database roles control user and administrator access, while BCrypt protects stored passwords. File checks evaluate indicators such as suspicious extensions, file metadata, and sampled entropy without executing or retaining uploaded files.

The frontend is hosted on Vercel and connected to the Railway-hosted backend. The file checks provide heuristic risk guidance; continuous device protection requires endpoint security software.

- [User website](https://cybershield-workspace.vercel.app/login)
- [Administrator database console](https://cybershield-api-production-9275.up.railway.app/database)
