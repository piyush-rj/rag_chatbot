const authHeader = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export default authHeader;
