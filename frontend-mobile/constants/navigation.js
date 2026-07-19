export const ANDROID_REVEAL = {
    presentation: 'transparentModal',
    animation: 'none',
    contentStyle: { backgroundColor: 'transparent' },
};

export function androidOpaque(background) {
    return {
        presentation: 'card',
        animation: 'default',
        contentStyle: { backgroundColor: background },
    };
}
