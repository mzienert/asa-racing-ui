'use server'

export async function initiateLogin(phone: string) {
    // TODO: Implement Cognito phone verification
    console.log('initiateLogin', phone);
    return true;
}

export async function verifyCode(phone: string, code: string) {
    console.log('verifyCode', phone, code);
    // TODO: Implement Cognito code verification
    return true;
} 