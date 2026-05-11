export interface DrivePickedFile {
    fileId: string;
    name: string;
    mimeType: string;
    sizeBytes?: number;
}

export interface DrivePickResult {
    files: DrivePickedFile[];
    accessToken: string;
}

export default class DrivePickerServices {
    private static readonly scope: string =
        'https://www.googleapis.com/auth/drive.file';
    private static pickerAPILoaded: boolean = false;

    static loadScript(src: string): Promise<void> {
        if (document.querySelector(`script[src="${src}"]`)) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.defer = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`failed to load ${src}`));
            document.head.appendChild(s);
        });
    }

    static async loadPickerAPI() {
        await this.loadScript('https://apis.google.com/js/api.js');
        if (this.pickerAPILoaded) return;

        await new Promise<void>((resolve) => {
            window.gapi.load('picker', () => {
                ((this.pickerAPILoaded = true), resolve());
            });
        });
    }

    static async getAccessToken(): Promise<string> {
        await this.loadScript('https://accounts.google.com/gsi/client');
        return new Promise<string>((resolve, reject) => {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                scope: this.scope,
                callback: (response: any) => {
                    if (response.error) {
                        reject(new Error(String(response.error)));
                    } else {
                        resolve(response.access_token);
                    }
                },
            });
            tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    static async showPicker(accessToken: string): Promise<DrivePickedFile[]> {
        await this.loadPickerAPI();
        return new Promise((resolve) => {
            const picker = new window.google.picker.PickerBuilder()
                .setOAuthToken(accessToken)
                .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY)
                .setAppId(process.env.NEXT_PUBLIC_GOOGLE_PROJECT_NUMBER)
                .addView(
                    new window.google.picker.DocsView()
                        .setMimeTypes('application/pdf')
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(false),
                )
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setCallback((data: any) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const files: DrivePickedFile[] = (data.docs ?? []).map(
                            (d: any) => ({
                                fileId: d.id,
                                name: d.name,
                                mimeType: d.mimeType,
                                sizeBytes: d.sizeBytes,
                            }),
                        );
                        resolve(files);
                    } else if (
                        data.action === window.google.picker.Action.CANCEL
                    ) {
                        resolve([]);
                    }
                })
                .build();
            picker.setVisible(true);
        });
    }

    static async connectAndPick(): Promise<DrivePickResult> {
        const accessToken = await this.getAccessToken();
        const files = await this.showPicker(accessToken);
        return { files, accessToken };
    }
}
