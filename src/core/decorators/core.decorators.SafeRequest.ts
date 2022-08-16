export const SafeRequest: MethodDecorator = (
    target: any,
    key: string | symbol,
    descriptor: PropertyDescriptor
) => {
    let originalMethod = descriptor.value;
    descriptor.value = async function(...args: any[]): Promise<any> {
        try {
            return await originalMethod.apply(this, args);
        } catch {
            return null;
        }
    }
    return descriptor;
};
