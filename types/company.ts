export interface HeaderTabConfig {
    id: string;
    name: string;
    icon: string;
    color: string;
    header_color?: string;
}

export interface CompanySettings {
    id: string;
    name: string;
    logo_url: string | null;
    favicon_url: string | null;
    loader_logo_url: string | null;
    footer_logo_url: string | null;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_image_url: string | null;
    header_bg_color: string;
    header_text_color: string;
    header_bg_image_url: string | null;
    primary_color: string;
    header_tabs_config: HeaderTabConfig[];
    banners: any[];
    header_announcement: string | null;
    gst_percentage: number;
    pan_number: string | null;
    gst_number: string | null;
    support_email: string | null;
    support_phone: string | null;
    address: string | null;
    about_us: string | null;
    refund_policy: string | null;
    terms_conditions: string | null;
    min_order_amount: number;
    is_under_maintenance: boolean;
    delivery_buffer_time: number;
    delivery_time_slots: any[];
    rider_time_slots: any[];
    app_version: string;
    is_force_update: boolean;
    promo_banners: string | null;
    screen_colors: any[];
    spotlight: any[];
    createdAt: string;
    updatedAt: string;
}

export interface CompanySettingsResponse {
    status: string;
    data: CompanySettings;
    _source?: string;
}
